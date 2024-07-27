<template>
  <div
    class="pageView grid grid-rows-[min-content,1fr]"
    v-loading="isSearching"
    element-loading-background="transparent"
    element-loading-text="Loading..."
  >
    <div class="controllers flex flex-nowrap mb-2">
      <InputSearch
        class="mr-3 grow"
        placeholder="Search channel name to add ..."
        v-model="searchValue"
        :disable-search="isSearching"
        @search="searchVod"
      />
    </div>

    <div class="searchResult relative">
      <div class="searchResultEl absolute inset-0">
        <el-scrollbar v-if="videosSearched.length">
          <div class="cards grid gap-3 p-4">
            <CardSearch
              v-for="item of videosSearched"
              :key="item.video.id"
              :video="item.video"
              @add-video="openAddDialog(item.downloadItem)"
            />
          </div>
        </el-scrollbar>

        <NoData v-show="!isSearching" v-else />
      </div>
    </div>
  </div>

  <DialogWrapper
    v-model:isShowDialog="isShowDialog"
    v-model:isShowDialogContent="isShowDialogContent"
  >
    <DialogVideo
      v-model:isShowDialogContent="isShowDialogContent"
      :item="videoToEdit"
    />
  </DialogWrapper>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import useConfig from '../store/config'
import { Config } from '../types/config'
import { ElMessage } from 'element-plus'
import DownloadSystem from '../util/download'
import useSearchResult from '../store/searchResult'
import { getFullVideos, getUsers, IVod } from '../api/user'
import { DownloadItem, VideoSearched } from '../types/download'

const configStore = useConfig()
const searchResultStore = useSearchResult()

const { videosSearched } = storeToRefs(searchResultStore)

const config = ref<Config>()

const isShowDialog = ref(false)

const isShowDialogContent = ref(false)

const videoToEdit = ref<DownloadItem>({
  videoID: '',
  createdTime: '',
  validDownloadTime: '',
  user_login: '',
  mod: 'queue',
  retryTimes: -1,
  url: '',
  filename: '',
  dirToSaveRecord: '',
  status: 'Queue',
  thumbnail_url: '',
  title: '',
  duration: ''
})

const isSearching = ref(false)

const searchValue = ref('')

const openAddDialog = (item: DownloadItem) => {
  videoToEdit.value = item

  isShowDialog.value = true
}

const getStreamer = async () => {
  const login = searchValue.value.trim()

  searchValue.value = ''

  const { data } = await getUsers({ login })

  return data
}

const searchVod = async () => {
  isSearching.value = true

  try {
    videosSearched.value = []

    const streamer = await getStreamer()

    if (streamer.length === 0) {
      ElMessage({
        message: 'Streamer not found',
        type: 'warning'
      })
      return
    }

    const videos = await getFullVideos({ user_id: streamer[0].id })

    if (videos.length === 0) {
      ElMessage({
        message: 'No videos available',
        type: 'warning'
      })
      return
    }

    videosSearched.value = await makeDownloadItem(videos)
  } catch (error) {
    console.error(error)
  } finally {
    isSearching.value = false
  }
}

const getConfig = async () => {
  if (!config.value) {
    config.value = await configStore.getConfig()
  }

  return config.value
}

const makeDownloadItem = async (videos: IVod[]): Promise<VideoSearched[]> => {
  const setting = await getConfig()

  return videos.map((video) => {
    const downloadItem = {
      videoID: video.id,
      createdTime: new Date().toJSON(),
      validDownloadTime: new Date().toJSON(),
      mod: 'queue',
      retryTimes: 0,
      url: video.url,
      filename: DownloadSystem.getVodFilename(
        setting.record.vodFileNameTemplate,
        video
      ),
      user_login: video.user_login,
      dirToSaveRecord: setting.general.dirToSaveRecord,
      status: 'Queue',
      thumbnail_url: video.thumbnail_url,
      title: video.title,
      duration: video.duration
    } as DownloadItem

    return {
      video,
      downloadItem
    }
  })
}
</script>

<style scoped>
.cards {
  @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5;
}
</style>
