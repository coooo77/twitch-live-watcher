<template>
  <div
    class="pageView grid grid-rows-[min-content,1fr]"
    v-loading="loading"
    element-loading-background="transparent"
    element-loading-text="Loading..."
  >
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
        <el-scrollbar>
          <div class="cards grid gap-3 p-4">
            <CardFollow
              v-for="streamer of followCardsDisplayed"
              :key="streamer.user_id"
              :streamer="streamer"
              :isUpdatingStreamer="isUpdatingStreamer"
              @editStreamer="openEditDialog(streamer.user_id)"
              @deleteStreamer="deleteStreamer(streamer.user_id)"
              @updateStreamer="updateRecordSetting(streamer.user_id, $event)"
            />
          </div>

          <Observer
            :hideObserver="loading || hideObserver"
            :observeTarget="followListEl"
            @intersect="loadCards"
          />
        </el-scrollbar>
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
import ModelSystem from '../util/model'
import StreamerSystem from '../util/streamers'
import useFollowListStore from '../store/followList'
import { handleJsonFile } from '../composable/common'
import { useNotification } from '../store/notification'
import { getUsers, GetUsersResponse } from '../api/user'
import { FollowList, Streamer, Streamers } from '../types/streamer'

const notify = useNotification()

const { importJSON, exportJSON } = handleJsonFile()

const followStore = useFollowListStore()

const searchValue = ref('')

const loading = ref(true)

const isSearching = ref(false)

const followListEl = ref<HTMLElement>()

const isUpdatingStreamer = ref(false)

const followList = toRef(followStore, 'followList')

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
  if (loading.value) return

  if (currentDisplayCount.value + steps < followStreamers.value.length) {
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

  await followStore.setFollowList(followList.value)
}

const deleteStreamer = async (user_id: string) => {
  const streamerExist = followList.value.streamers[user_id]

  const onlineExist = followList.value.onlineList.findIndex(
    (id) => id === user_id
  )

  if (!streamerExist && !onlineExist) return

  if (streamerExist) delete followList.value.streamers[user_id]

  if (onlineExist !== -1) followList.value.onlineList.splice(onlineExist, 1)

  // TODO: stop record?
  await followStore.setFollowList(followList.value)
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

    await followStore.setFollowList(followList.value)
  } catch (error) {
    console.error(error)
  } finally {
    isUpdatingStreamer.value = false
  }
}

const getStreamers = async () => {
  const streamerList = Array.from(new Set(searchValue.value.trim().split(';')))

  const login = streamerList.filter((account) => {
    const isNumber = new RegExp('^[0-9]+$')

    return !isNumber.test(account)
  })

  if (login.length === 0) return []

  searchValue.value = ''

  const { data } = await getUsers({ login })

  return data
}

const transformStreamerData = async (
  streamers: GetUsersResponse[]
): Promise<Streamer[]> => {
  const { record } = await ModelSystem.getConfig()

  return streamers.map((streamer) => ({
    user_login: streamer.login,
    user_id: streamer.id,
    displayName: streamer.display_name,
    profileImg: streamer.profile_image_url,
    offlineImg: streamer.offline_image_url,
    status: { isOnline: false, isRecording: false },
    recordSetting: record
  }))
}

const updateFollowList = async (newStreamers: Streamer[]) => {
  await followStore.getFollowList()

  const streamers = newStreamers.reduce((acc, streamer) => {
    const data = followList.value.streamers[streamer.user_id]

    if (data === undefined) {
      acc[streamer.user_id] = streamer
    }

    return acc
  }, {} as Streamers)

  followList.value.streamers = Object.assign(
    followList.value.streamers,
    streamers
  )

  const isUpdateSuccess = await followStore.setFollowList(followList.value)

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

    const newStreamers = await transformStreamerData(streamers)

    await updateFollowList(newStreamers)
  } catch (error) {
    console.error(error)
  } finally {
    isSearching.value = false
  }
}

const assignFollowList = async (importData: FollowList) => {
  followList.value = importData

  await ModelSystem.setFollowList(importData)
}

const importFollowList = async () => await importJSON(assignFollowList)

const exportFollowList = async () =>
  await exportJSON(followList.value, 'followList', 'Export Follow List')

onBeforeMount(async () => {
  try {
    await followStore.getFollowList()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.followList .cards {
  @apply grid-cols-1 mobileL:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6;
}
</style>
