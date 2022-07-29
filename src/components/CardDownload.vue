<template>
  <div
    class="cardDownload relative generalShadow overflow-hidden rounded-lg border border-themeColor4 bg-themeColor1 flex flex-col"
  >
    <div class="header border-b bg-themeColor4 relative grow flex">
      <div
        :class="[
          video.status === 'Downloading' ? 'bg-themeColor5' : 'bg-themeColor4'
        ]"
        class="status absolute top-2 right-2 text"
      >
        {{ video.status }}
      </div>

      <img
        v-show="imgUrl"
        class="thumbnail w-full border-themeColor4"
        :src="imgUrl"
        :alt="video.videoID"
      />

      <div
        v-show="imgUrl === ''"
        class="noImg text-themeColor1 font-bold text-center m-auto text-xl"
      >
        NO IMAGE
      </div>
    </div>

    <div
      class="footer mt-auto grid grid-rows-[min-content,min-content,min-content] gap-1 p-2"
    >
      <div
        :title="video.title"
        class="title text-themeColor4 font-bold whitespace-nowrap truncate"
      >
        {{ video.title }}
      </div>

      <div
        class="publishTime text-themeColor4 font-bold whitespace-nowrap truncate"
      >
        {{ displayTime }}
      </div>

      <div class="btn">
        <template v-if="video.status === 'Downloading'">
          <el-popconfirm
            title="Are you sure to cancel?"
            @confirm="cancelDownload"
          >
            <template #reference>
              <el-button v-show="!hideAbortBtn" class="w-full" type="danger">
                <strong>CANCEL</strong>
              </el-button>
            </template>
          </el-popconfirm>
        </template>

        <template v-if="video.status === 'Queue'">
          <el-popconfirm
            title="Are you sure to delete?"
            @confirm="deleteDownload"
          >
            <template #reference>
              <el-button class="w-full" type="danger">
                <strong>DELETE</strong>
              </el-button>
            </template>
          </el-popconfirm>
        </template>

        <template v-if="video.status === 'Success'">
          <el-button
            color="#576F72"
            class="w-full"
            type="danger"
            @click="deleteDownload"
          >
            <strong>DELETE</strong>
          </el-button>
        </template>

        <template v-if="video.status === 'Cancelled'">
          <div class="removeOrRetry grid grid-cols-2 gap-2">
            <el-popconfirm
              title="Are you sure to delete?"
              @confirm="removeDownload"
            >
              <template #reference>
                <el-button class="w-full" type="danger">
                  <strong>REMOVE</strong>
                </el-button>
              </template>
            </el-popconfirm>

            <el-button
              class="w-full !ml-0"
              color="#576F72"
              @click="retryDownload"
            >
              <strong>RETRY</strong>
            </el-button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DownloadSystem from '../util/download'
import { DownloadItem } from '../types/download'
import { getUrlAndPublish } from '../composable/download'

const props = defineProps<{
  video: DownloadItem
  hideAbortBtn: boolean
}>()

const { thumbnail_url, validDownloadTime } = toRefs(props.video)

const { imgUrl, displayTime } = getUrlAndPublish(
  thumbnail_url.value,
  validDownloadTime.value
)

const retryDownload = () => {
  DownloadSystem.reTryVodDownload(props.video)
}

const cancelDownload = () => {
  DownloadSystem.cancelVodDownload(props.video)
}

const deleteDownload = () => {
  const { status } = props.video

  const type = status === 'Queue' ? 'queue' : 'success'

  DownloadSystem.deleteVodDownload(props.video, type)
}

const removeDownload = () => {
  DownloadSystem.deleteVodDownload(props.video, 'error')
}
</script>

<style scoped>
.text {
  @apply font-bold py-1 px-2 rounded-md text-themeColor1 border border-themeColor1 text-center;
}
</style>