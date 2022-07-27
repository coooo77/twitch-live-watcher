<template>
  <div
    class="streamerInfo w-full bg-themeColor1 rounded-lg relative max-w-[910px] p-8 flex flex-col h-[90vh]"
  >
    <div class="cancelBtn cursor-pointer" @click="closeDialog">
      <div class="icon" />
    </div>

    <div class="absolute left-9 right-9 top-9 bottom-24">
      <el-scrollbar>
        <div class="layout pt-10 grid grid-rows-[min-content,1fr] gap-4 w-full max-w-[600px] m-auto">
          <DividerTitle title="Add VOD to Download List" />

          <div class="info grid grid-cols-[min-content,1fr] grid-rows-3 gap-2 rounded-xl insetShadow bg-themeColor2 p-4">
            <div class="title text text-right">
              Title&#xff1a
            </div>

            <div class="titleValue text whitespace-nowrap">
              {{ title }}
            </div>

            <div class="folder text text-right">
              Folder&#xff1a
            </div>

            <div class="dirToSaveRecord grid grid-cols-[1fr,min-content] gap-2 items-center">
              <el-input
                disabled
                size="small"
                v-model="editItem.dirToSaveRecord"
                placeholder="Filename Template For VOD"
              />

              <el-button
                size="small"
                @click="setRecordSaveDir"
                color="#576F72"
              >
                <strong>Edit</strong>
              </el-button>
            </div>

            <div class="folder text text-right">
              Filename&#xff1a
            </div>

            <div class="filename">
              <el-input
                size="small"
                v-model="editItem.filename"
                placeholder="Filename Template For VOD"
              />
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="footer absolute left-8 right-8 bottom-8 flex justify-end">
      <el-button color="#576F72" @click="closeDialog"
        ><strong>Cancel</strong>
      </el-button>

      <el-button color="#576F72" plain type="primary" @click="addVideo">
        <strong>Confirm</strong>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDirPath } from '../util/common'
import { DownloadItem } from '../types/download';
import useDownloadListStore from '../store/download'
import { useNotification } from '../store/notification'

const props = defineProps<{
  item: DownloadItem
  title: string
  isShowDialogContent: boolean
}>()

const isProcessing = ref(false)

const notify = useNotification()

const download = useDownloadListStore()

const { isShowDialogContent } = toRefs(props)

const editItem = ref<DownloadItem>(props.item)

const emit = defineEmits<{
  (eventName: 'update:isShowDialogContent', value: boolean): void
}>()

const closeDialog = () => emit('update:isShowDialogContent', false)

const addVideo = async () => {
  isProcessing.value= true
  
  try {
    const index = download.downloadList.vodList.queue.findIndex(vod => vod.videoID === editItem.value.videoID)

    if (index === -1) {
      download.downloadList.vodList.queue.push(editItem.value)     
    } else {
      download.downloadList.vodList.queue[index] = Object.assign({}, editItem.value)
    }

    const result = await download.setDownloadList()

    const msg = result ? 'Add video successfully' : 'Fail to add video'
  
    notify.send(msg, result)
  
    closeDialog()
  } catch (error) {
    console.error(error)
  } finally {
    isProcessing.value = false
  }
}

const setRecordSaveDir = async () => {
  const res = await getDirPath()

  if (!res) return

  editItem.value.dirToSaveRecord = res
}

watch(isShowDialogContent, (newVal, oldValue) => {
  editItem.value = Object.assign({}, props.item)
})
</script>

<style lang="scss" scoped>
.cancelBtn {
  --plusColor: #576f72;
  position: absolute;
  width: 20px;
  height: 20px;
  box-sizing: content-box;
  top: 13px;
  right: 13px;

  .icon {
    width: 100%;
    height: 100%;
    position: relative;
    transform: rotate(-45deg);

    &::after,
    &::before {
      content: '';
      background: var(--plusColor);
      position: absolute;
    }

    &::after {
      height: 2px;
      width: 20px;
      top: 50%;
      transform: translateY(-50%);
    }

    &::before {
      height: 20px;
      width: 2px;
      left: 50%;
      transform: translateX(-50%);
    }
  }
}

.text {
  @apply font-bold text-themeColor4;
}

</style>
