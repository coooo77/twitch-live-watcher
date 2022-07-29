<template>
  <div class="pageView relative">
    <div class="layout absolute inset-0">
      <el-scrollbar v-if="downloadItems.length">
        <div class="cards grid gap-3 p-4">
          <CardDownload
            v-for="video of downloadItems"
            :key="video.videoID"
            :video="video"
            :hideAbortBtn="config.userConfig.general.showDownloadCmd"
          />
        </div>
      </el-scrollbar>

      <NoData v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import useConfig from '../store/config'
import useDownload from '../store/download'
import { DownloadItem } from '../types/download'

const config = useConfig()

const download = useDownload()

const downloadItems = computed(() => {
  const { success, onGoing, queue, error } = download.downloadList.vodList

  return [...success, ...onGoing, ...queue, ...error] as DownloadItem[]
})
</script>

<style scoped>
.cards {
  @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5;
}
</style>
