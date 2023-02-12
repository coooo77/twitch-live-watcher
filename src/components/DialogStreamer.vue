<template>
  <div
    class="streamerInfo w-full bg-themeColor1 rounded-lg relative max-w-[910px] p-8 flex flex-col h-[90vh]"
  >
    <div class="cancelBtn cursor-pointer" @click="closeDialog">
      <div class="icon" />
    </div>

    <div class="absolute left-9 right-9 top-9 bottom-24">
      <el-scrollbar>
        <div class="layout pt-10">
          <div class="content flex flex-col gap-2 w-full max-w-[600px] m-auto">
            <div class="status rounded-xl insetShadow bg-themeColor2 grid grid-rows-[1fr,min-content] sm:grid-rows-1 sm:grid-cols-[33%,1fr] gap-2 p-4">
              <div class="left relative overflow-hidden">
                <div class="profile h-0 pb-[100%] relative">
                  <div
                    class="profileImg bg-center bg-cover absolute inset-0"
                    :style="{
                      'background-image': `url(${streamer.profileImg})`
                    }"
                  />
                </div>
              </div>

              <div class="right w-full grid grid-rows-4 gap-1">
                <div class="userName border-b-4 border-themeColor4">
                  <div class="text text-2xl text-center sm:text-left">
                    {{ streamer.displayName }}
                  </div>
                </div>

                <div class="recordStatus statusText">
                  <div class="text text-right text-lg">
                    Record&#xff1a
                  </div>

                  <div class="status statusInfo bg-themeColor4">
                    {{ status.isRecording ? 'Recording' : 'None' }}
                  </div>
                </div>

                <div class="liveStatus statusText">
                  <div class="text text-right text-lg">
                    Status&#xff1a
                  </div>

                  <div :class="[status.isOnline ? 'bg-themeColor5' : 'bg-themeColor4']" class="status statusInfo bg-themeColor4">
                    {{ status.isOnline ? 'LIVE' : 'Offline' }}
                  </div>
                </div>

                <div class="lastStreamStatus statusText">
                  <div class="text text-right text-lg">
                    Last Stream&#xff1a
                  </div>

                  <div class="status statusInfo bg-themeColor4">
                    {{ lastStream }}
                  </div>
                </div>
              </div>
            </div>

            <DividerTitle title="General Settings" />

            <div class="generalSetting settingLayout insetShadow">
              <InputRow title="Enable Record">
                <el-switch
                  size="small"
                  v-model="streamer.recordSetting.enableRecord"
                />

                <template #popIcon>
                  <Explanation :content="record.enableRecord" />
                </template>
              </InputRow>

              <InputRow title="Enable Notify">
                <el-switch
                  size="small"
                  v-model="streamer.recordSetting.enableNotify"
                />
                <template #popIcon>
                  <Explanation :content="record.enableNotify" />
                </template>
              </InputRow>

              <InputRow title="Filename Template">
                <el-input
                  size="small"
                  v-model="streamer.recordSetting.fileNameTemplate"
                  placeholder="Filename Template For Live Record"
                />
                <template #popIcon>
                  <Explanation :content="record.fileNameTemplate" />
                </template>
              </InputRow>

              <InputRow title="Enable Tag Check">
                <el-switch
                  size="small"
                  v-model="streamer.recordSetting.checkStreamContentTypeEnable"
                />
                <template #popIcon>
                  <Explanation
                    :content="record.checkStreamContentTypeEnable"
                  />
                </template>
              </InputRow>

              <InputRow title="Abort Invalid Tag">
                <el-switch
                  size="small"
                  v-model="streamer.recordSetting.abortInvalidRecord"
                />
                <template #popIcon>
                  <Explanation
                    :content="record.abortInvalidRecord"
                  />
                </template>
              </InputRow>

              <InputRow title="Game Tag List">
                <el-input
                  size="small"
                  v-model="
                    streamer.recordSetting.checkStreamContentTypeTargetGameNames
                  "
                  placeholder="write game tag here"
                />
                <template #popIcon>
                  <Explanation
                    :content="record.checkStreamContentTypeTargetGameNames"
                  />
                </template>
              </InputRow>
            </div>

            <DividerTitle title="VOD Settings" />

            <div class="vodSetting settingLayout insetShadow">
              <InputRow title="Enable VOD">
                <el-switch
                  size="small"
                  v-model="streamer.recordSetting.vodEnableRecordVOD"
                />

                <template #popIcon>
                  <Explanation :content="record.vodEnableRecordVOD" />
                </template>
              </InputRow>

              <InputRow title="Is Stop Record">
                <el-switch
                  size="small"
                  v-model="streamer.recordSetting.vodIsStopRecordStream"
                />

                <template #popIcon>
                  <Explanation :content="record.vodIsStopRecordStream" />
                </template>
              </InputRow>

              <InputRow title="Download If No Vod">
                <el-switch
                  size="small"
                  v-model="streamer.recordSetting.vodGetStreamIfNoVod"
                />
                <template #popIcon>
                  <Explanation :content="record.vodGetStreamIfNoVod" />
                </template>
              </InputRow>

              <InputRow title="Download Mode">
                <div
                  class="vodDownloadMode flex flex-nowrap items-center gap-2"
                >
                  <el-select
                    v-model="streamer.recordSetting.vodMode"
                    placeholder="Select"
                    size="small"
                  >
                    <el-option
                      v-for="item in recordModeList"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <template
                    v-if="streamer.recordSetting.vodMode === 'countDown'"
                  >
                    <el-input-number
                      v-model="streamer.recordSetting.vodCountDownInMinutes"
                      :min="0"
                      :max="1440"
                      size="small"
                      controls-position="right"
                    />
                    <div class="font-bold text-themeColor4">minutes</div>
                  </template>
                  <template
                    v-else-if="streamer.recordSetting.vodMode === 'timeZone'"
                  >
                    <el-time-picker
                      v-model="streamer.recordSetting.vodTimeZone"
                      placeholder="time zone"
                      size="small"
                      :clearable="false"
                    />
                  </template>
                </div>
                <template #popIcon>
                  <Explanation :content="record.vodMode">
                    <template #popContent>
                      <el-table :data="vodModeExplanation">
                        <!-- prettier-ignore -->
                        <el-table-column
                           width="120"
                           property="mode"
                           label="Mode"
                         />
                        <el-table-column
                          width="300"
                          property="explanation"
                          label="Explanation"
                        />
                      </el-table>
                    </template>
                  </Explanation>
                </template>
              </InputRow>

              <InputRow title="Filename Template">
                <el-input
                  size="small"
                  v-model="streamer.recordSetting.vodFileNameTemplate"
                  placeholder="Filename Template For VOD"
                />
                <template #popIcon>
                  <Explanation :content="record.vodFileNameTemplate">
                    <template #popContent>
                      <el-table :data="wildcardExplanation">
                        <!-- prettier-ignore -->
                        <el-table-column
                           width="auto"
                           property="wildcard"
                           label="Wildcard"
                         />
                        <el-table-column
                          width="auto"
                          property="description"
                          label="Description"
                        />
                        <el-table-column
                          width="auto"
                          property="example"
                          label="Example"
                        />
                      </el-table>
                    </template>
                  </Explanation>
                </template>
              </InputRow>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="footer absolute left-8 right-8 bottom-8 flex justify-end">
      <el-button color="#576F72" @click="closeDialog"
        ><strong>Cancel</strong>
      </el-button>

      <el-button color="#576F72" plain type="primary" @click="editStreamer">
        <strong>Confirm</strong>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import useFollow from '../store/follow'
import ConfigSystem from '../util/config'
import { Streamer } from '../types/streamer'
// FIXME copy raw data and resume default streamer data
const props = defineProps<{
  streamer: Streamer
  isShowDialogContent: boolean
}>()

const emit = defineEmits<{
  (eventName: 'editStreamer', value: Streamer): void
  (eventName: 'update:isShowDialogContent', value: boolean): void
}>()

const follow = useFollow()

const { record } = ConfigSystem.explanation

const { recordModeList, vodModeExplanation, wildcardExplanation } = ConfigSystem

const closeDialog = () => emit('update:isShowDialogContent', false)

const lastStream = computed(() => {
  const lastStreamTime = props.streamer?.status.streamStartedAt

  if (!lastStreamTime) return 'Unknown'

  const time = new Date(lastStreamTime)

  const year = time.getFullYear()

  const month = time.getMonth() + 1

  const date = time.getDate()

  return [year, month, date].join('/')
})

const status = computed(() => {
  const streamerStatus = follow.followList.onlineList[props.streamer?.user_id]

  if (!streamerStatus) return { isRecording: false, isOnline: false }

  return {
    isRecording: streamerStatus.isRecording,
    isOnline: true
  }
})

const editStreamer = () => {
  emit('editStreamer', props.streamer)

  closeDialog()
}
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

.statusText {
  @apply grid grid-cols-2 gap-2 items-end;
}

.statusInfo {
  @apply flex items-end justify-center font-bold text-themeColor1 rounded-md;
}

.el-switch {
  --el-switch-on-color: #576f72;
  --el-switch-off-color: #7D9D9C;
  --el-switch-border-color: #7d9d9c;
}

.settingLayout {
  @apply flex flex-col gap-1 p-4 rounded-xl bg-themeColor2;
}

</style>
