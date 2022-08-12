<template>
  <div
    class="carLive relative generalShadow overflow-hidden rounded-lg border border-themeColor4 bg-themeColor1"
  >
    <div
      v-if="isRecording"
      class="recordingIcon font-bold bg-themeColor5 text-themeColor1 border border-themeColor1 flex items-center justify-center px-2 py-1 rounded absolute left-2 top-2"
    >
      <div class="text leading-4 flex items-center justify-center">REC</div>
    </div>

    <img
      @click="openUrl(`https://www.twitch.tv/${stream.user_login}`)"
      class="thumbnail w-full border-b border-themeColor4 cursor-pointer"
      :src="imgUrl"
      :alt="stream.id"
    />

    <div
      class="footer grid grid-rows-[min-content,min-content,min-content] grid-cols-[1fr,min-content] p-2"
    >
      <div
        :title="stream.title"
        class="title truncate col-span-full font-bold text-themeColor4"
      >
        {{ stream.title }}
      </div>

      <div
        :title="liveCardHost"
        class="userName truncate col-span-full font-bold text-themeColor4 whitespace-nowrap"
      >
        {{ liveCardHost }}
      </div>

      <div class="tag truncate font-bold text-themeColor4">
        {{ stream.game_name }}
      </div>

      <div
        class="abortBtn col-start-2 row-start-3 row-end-4 flex items-end justify-end"
      >
        <template v-if="isRecording">
          <el-popconfirm
            title="Are you sure to AbortRecord?"
            @confirm="abortRecord"
          >
            <template #reference>
              <el-button
                v-show="!hideAbortBtn"
                :disabled="isProcessing"
                size="small"
                type="danger"
              >
                <strong>Abort</strong>
              </el-button>
            </template>
          </el-popconfirm>
        </template>

        <template v-else>
          <el-button
            size="small"
            color="#576F72"
            @click="startRecord"
            :disabled="isProcessing"
          >
            <strong>Record</strong>
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { openUrl } from '../util/common'
import { FollowedStream } from '../api/user'
import DownloadSystem from '../util/download'

const props = defineProps<{
  stream: FollowedStream
  isRecording: boolean
  hideAbortBtn: boolean
}>()

defineEmits<{
  (eventName: 'abortRecord', user_id: string): void
  (eventName: 'startRecord', user_id: string): void
}>()

const isProcessing = ref(false)

const imgUrl = computed(() => {
  return props.stream.thumbnail_url
    .replace('{width}', '320')
    .replace('{height}', '180')
})

const liveCardHost = computed(() => {
  const { user_name, user_login } = props.stream

  return `${user_name || user_login} (${user_login})`
})

const startRecord = async () => {
  isProcessing.value = true

  try {
    await DownloadSystem.recordLiveStream(props.stream)
  } catch (error) {
    console.error(error)
  } finally {
    isProcessing.value = false
  }
}

const abortRecord = async () => {
  isProcessing.value = true

  try {
    await DownloadSystem.abortLiveRecord(props.stream)
  } catch (error) {
    console.error(error)
  } finally {
    isProcessing.value = false
  }
}
</script>
