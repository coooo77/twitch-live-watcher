<template>
  <div class="pageView grid grid-rows-[min-content,1fr]">
    <div class="controllers flex flex-nowrap mb-2">
      <InputSearch
        class="mr-3 grow"
        placeholder="Search channel name to add ..."
        v-model="searchValue"
        :disable-search="isSearching"
        @search="addStreamerToFollowList"
      />

      <el-button color="#576F72" @click="importFollowList">
        <strong>Import</strong>
      </el-button>

      <el-button color="#576F72" @click="exportFollowList">
        <strong>Export</strong>
      </el-button>
    </div>

    <div class="followList relative grow">
      <div ref="followListEl" class="layout absolute inset-0 overflow-auto">
        <el-scrollbar v-if="followCardsDisplayed.length">
          <div class="cards grid gap-3 p-4">
            <CardFollow
              v-for="streamer of followCardsDisplayed"
              :key="streamer.user_id"
              :streamer="streamer"
              :isUpdatingStreamer="isUpdatingStreamer"
              @update-profile="updateStreamerProfileImg"
              @editStreamer="openEditDialog(streamer.user_id)"
              @deleteStreamer="deleteStreamer(streamer.user_id)"
              @updateStreamer="updateRecordSetting(streamer.user_id, $event)"
            />
          </div>

          <Observer
            :hideObserver="hideObserver"
            :observeTarget="followListEl"
            @intersect="loadCards"
          />
        </el-scrollbar>

        <NoData v-else />
      </div>
    </div>
  </div>

  <DialogWrapper
    v-model:isShowDialog="isShowDialog"
    v-model:isShowDialogContent="isShowDialogContent"
  >
    <DialogStreamer
      v-model:isShowDialogContent="isShowDialogContent"
      :streamer="dialogStreamer"
      @edit-streamer="editStreamer"
    />
  </DialogWrapper>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import useFollow from '../store/follow'
import useConfig from '../store/config'
import StreamerSystem from '../util/streamers'
import { handleJsonFile } from '../composable/common'
import { useNotification } from '../store/notification'
import { getUsers, GetUsersResponse } from '../api/user'
import { FollowList, Streamer, Streamers } from '../types/streamer'

const notify = useNotification()

const { importJSON, exportJSON } = handleJsonFile()

const config = useConfig()

const follow = useFollow()

const searchValue = ref('')

const isSearching = ref(false)

const followListEl = ref<HTMLElement>()

const isUpdatingStreamer = ref(false)

const { followList } = storeToRefs(follow)

const steps = 9

const hideObserver = ref(false)

const currentDisplayCount = ref(9)

const isShowDialog = ref(false)

const isShowDialogContent = ref(false)

const dialogStreamer = ref<Streamer>(StreamerSystem.defaultStreamer)

const followStreamers = computed(() => {
  return Object.values(followList.value.streamers)
})

const followCardsDisplayed = computed(() => {
  return followStreamers.value.slice(0, currentDisplayCount.value)
})

const loadCards = (observer: IntersectionObserver) => {
  if (currentDisplayCount.value < followStreamers.value.length) {
    currentDisplayCount.value += steps
  } else {
    observer.disconnect()

    hideObserver.value = true
  }
}

const openEditDialog = (user_id: string) => {
  const streamerExist = followList.value.streamers[user_id]

  if (!streamerExist) return

  dialogStreamer.value = streamerExist

  isShowDialog.value = true
}

const editStreamer = async (streamer: Streamer) => {
  const streamerExist = followList.value.streamers[streamer.user_id]

  if (!streamerExist) return

  followList.value.streamers[streamer.user_id] = streamer

  await follow.setFollowList(followList.value)
}

const deleteStreamer = async (user_id: string) => {
  const streamerExist = followList.value.streamers[user_id]

  const onlineExist = followList.value.onlineList[user_id] !== undefined

  if (!streamerExist && !onlineExist) return

  if (streamerExist) delete followList.value.streamers[user_id]

  if (onlineExist) delete followList.value.onlineList[user_id]

  // TODO: stop record?
  await follow.setFollowList(followList.value)
}

const updateRecordSetting = async (
  user_id: string,
  key: 'enableRecord' | 'enableNotify' | 'vodEnableRecordVOD'
) => {
  isUpdatingStreamer.value = true

  try {
    const streamerExist = followList.value.streamers[user_id]

    if (streamerExist) {
      followList.value.streamers[user_id].recordSetting[key] =
        !followList.value.streamers[user_id].recordSetting[key]
    }

    await follow.setFollowList(followList.value)
  } catch (error) {
    console.error(error)
  } finally {
    isUpdatingStreamer.value = false
  }
}

const getStreamers = async () => {
  const login = Array.from(new Set(searchValue.value.trim().split(';')))

  if (login.length === 0) return []

  searchValue.value = ''

  const { data } = await getUsers({ login })

  return data
}

const transformStreamerData = (streamers: GetUsersResponse[]): Streamer[] => {
  return streamers.map((streamer) => ({
    user_login: streamer.login,
    user_id: streamer.id,
    displayName: streamer.display_name,
    profileImg: streamer.profile_image_url,
    offlineImg: streamer.offline_image_url,
    status: {},
    recordSetting: Object.assign({}, config.userConfig.record)
  }))
}

const updateFollowList = async (newStreamers: Streamer[]) => {
  for (const streamer of newStreamers) {
    const target = follow.followList.streamers[streamer.user_id]

    if (target === undefined) {
      follow.followList.streamers[streamer.user_id] = streamer
    } else {
      follow.followList.streamers[streamer.user_id] = Object.assign(
        follow.followList.streamers[streamer.user_id],
        {
          user_login: streamer.user_login,
          user_id: streamer.user_id,
          displayName: streamer.displayName,
          profileImg: streamer.profileImg,
          offlineImg: streamer.offlineImg
        }
      )
    }
  }

  const isUpdateSuccess = await follow.setFollowList()

  const status = isUpdateSuccess
    ? 'Update streamers successfully'
    : 'Failed to update streamers'

  notify.send(status)
}

const addStreamerToFollowList = async () => {
  isSearching.value = true

  try {
    const streamers = await getStreamers()

    if (streamers.length === 0) return notify.send('No streamers were found')

    const newStreamers = transformStreamerData(streamers)

    await updateFollowList(newStreamers)
  } catch (error) {
    console.error(error)
  } finally {
    isSearching.value = false
  }
}

const assignFollowList = async (importData: FollowList) => {
  follow.followList = importData

  await follow.setFollowList()
}

const importFollowList = async () => await importJSON(assignFollowList)

const exportFollowList = async () =>
  await exportJSON(followList.value, 'followList', 'Export Follow List')

const updateStreamerProfileImg = async (streamer: GetUsersResponse) => {
  const { id, display_name, profile_image_url, offline_image_url } = streamer

  if (!follow.followList.streamers[id]) {
    throw Error(
      `Can not find streamer to update, id: ${id}, name: ${display_name}`
    )
  }

  follow.followList.streamers[id].displayName = display_name

  follow.followList.streamers[id].profileImg = profile_image_url

  follow.followList.streamers[id].offlineImg = offline_image_url

  await follow.setFollowList()
}
</script>

<style scoped>
.followList .cards {
  @apply grid-cols-1 mobileL:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6;
}
</style>
