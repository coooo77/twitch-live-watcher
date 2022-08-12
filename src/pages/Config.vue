<template>
  <div
    class="pageView grid grid-rows-[min-content,1fr]"
    v-loading="loading"
    element-loading-background="transparent"
    element-loading-text="Loading..."
  >
    <div class="controllers mb-2">
      <el-button
        color="#576F72"
        plain
        :disabled="!isConfigChanged"
        @click="saveConfig"
      >
        <strong>Save</strong>
      </el-button>

      <el-button color="#576F72" @click="importConfig">
        <strong>Import</strong>
      </el-button>

      <el-button color="#576F72" @click="exportConfig">
        <strong>Export</strong>
      </el-button>

      <el-popconfirm
        title="Are you sure to resume config to default?"
        @confirm="resumeConfig"
      >
        <template #reference>
          <el-button type="danger">
            <strong>Default</strong>
          </el-button>
        </template>
      </el-popconfirm>
    </div>

    <div class="configs relative" v-if="userConfig">
      <div class="responsive absolute inset-0">
        <el-scrollbar>
          <el-collapse v-model="activeNames" accordion>
            <el-collapse-item name="defaultStreamerSetting">
              <template #title>
                <div class="collapseTitle">Default Streamer Setting</div>
              </template>

              <div class="configContent">
                <InputRow title="Enable Record">
                  <el-switch
                    size="small"
                    v-model="userConfig.record.enableRecord"
                  />

                  <template #popIcon>
                    <Explanation :content="record.enableRecord" />
                  </template>
                </InputRow>

                <InputRow title="Enable Notify">
                  <el-switch
                    size="small"
                    v-model="userConfig.record.enableNotify"
                  />

                  <template #popIcon>
                    <Explanation :content="record.enableNotify" />
                  </template>
                </InputRow>

                <InputRow title="Enable Record VOD">
                  <el-switch
                    size="small"
                    v-model="userConfig.record.vodEnableRecordVOD"
                  />

                  <template #popIcon>
                    <Explanation :content="record.vodEnableRecordVOD" />
                  </template>
                </InputRow>

                <InputRow title="Is Stop Record Stream">
                  <el-switch
                    size="small"
                    v-model="userConfig.record.vodIsStopRecordStream"
                  />

                  <template #popIcon>
                    <Explanation :content="record.vodIsStopRecordStream" />
                  </template>
                </InputRow>

                <InputRow title="Download If No Vod">
                  <el-switch
                    size="small"
                    v-model="userConfig.record.vodGetStreamIfNoVod"
                  />

                  <template #popIcon>
                    <Explanation :content="record.vodGetStreamIfNoVod" />
                  </template>
                </InputRow>

                <InputRow title="VOD Download Mode">
                  <div
                    class="vodDownloadMode flex flex-nowrap items-center gap-2"
                  >
                    <el-select
                      v-model="userConfig.record.vodMode"
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

                    <template v-if="userConfig.record.vodMode === 'countDown'">
                      <el-input-number
                        v-model="userConfig.record.vodCountDownInMinutes"
                        :min="0"
                        :max="1440"
                        size="small"
                        controls-position="right"
                      />

                      <div class="font-bold text-themeColor4">minutes</div>
                    </template>

                    <template
                      v-else-if="userConfig.record.vodMode === 'timeZone'"
                    >
                      <el-time-picker
                        v-model="userConfig.record.vodTimeZone"
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

                <InputRow title="VOD Filename Template">
                  <el-input
                    size="small"
                    v-model="userConfig.record.vodFileNameTemplate"
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

                <InputRow title="Live Filename Template">
                  <el-input
                    size="small"
                    v-model="userConfig.record.fileNameTemplate"
                    placeholder="Filename Template For Live Record"
                  />

                  <template #popIcon>
                    <Explanation :content="record.fileNameTemplate">
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

                <InputRow title="Enable Tag Check">
                  <el-switch
                    size="small"
                    v-model="userConfig.record.checkStreamContentTypeEnable"
                  />

                  <template #popIcon>
                    <Explanation
                      :content="record.checkStreamContentTypeEnable"
                    />
                  </template>
                </InputRow>

                <InputRow title="Game Tag List">
                  <el-input
                    size="small"
                    v-model="
                      userConfig.record.checkStreamContentTypeTargetGameNames
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
            </el-collapse-item>

            <el-collapse-item name="generalSetting">
              <template #title>
                <div class="collapseTitle">General Setting</div>
              </template>

              <div class="configContent">
                <InputRow title="Check Stream Interval">
                  <el-input-number
                    v-model="userConfig.general.checkStreamInterval"
                    :min="30"
                    size="small"
                    controls-position="right"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.checkStreamInterval" />
                  </template>
                </InputRow>

                <InputRow title="Directory to Save">
                  <div class="dirToSaveRecord flex flex-nowrap gap-2">
                    <el-input
                      disabled
                      size="small"
                      v-model="userConfig.general.dirToSaveRecord"
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

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.dirToSaveRecord" />
                  </template>
                </InputRow>

                <InputRow title="Number of Record limit">
                  <el-input-number
                    v-model="userConfig.general.numOfDownloadLimit"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.numOfDownloadLimit" />
                  </template>
                </InputRow>

                <InputRow title="Is Show Cmd">
                  <el-switch
                    size="small"
                    v-model="userConfig.general.showDownloadCmd"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.showDownloadCmd" />
                  </template>
                </InputRow>
              </div>
            </el-collapse-item>

            <el-collapse-item name="vodSetting">
              <template #title>
                <div class="collapseTitle">VOD Setting</div>
              </template>

              <div class="configContent">
                <InputRow title="Download Retry Interval">
                  <el-input-number
                    v-model="userConfig.vod.reTryDownloadInterval"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="vod.reTryDownloadInterval" />
                  </template>
                </InputRow>

                <InputRow title="Max ReDownload Times">
                  <el-input-number
                    v-model="userConfig.vod.maxReDownloadTimes"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="vod.maxReDownloadTimes" />
                  </template>
                </InputRow>

                <InputRow title="Integrity Check">
                  <el-switch
                    size="small"
                    v-model="userConfig.vod.IntegrityCheck"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="vod.IntegrityCheck" />
                  </template>
                </InputRow>

                <InputRow
                  v-show="userConfig.vod.IntegrityCheck"
                  title="Loss Duration Allowed"
                >
                  <el-input-number
                    v-model="userConfig.vod.LossOfVODDurationAllowed"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="vod.LossOfVODDurationAllowed" />
                  </template>
                </InputRow>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import useConfig from '../store/config'
import { Config } from '../types/config'
import ConfigSystem from '../util/config'
import { getDirPath } from '../util/common'
import { onBeforeRouteLeave } from 'vue-router'
import { handleJsonFile } from '../composable/common'
import { useNotification } from '../store/notification'

const config = useConfig()

const notify = useNotification()

const { importJSON, exportJSON } = handleJsonFile()

const { userConfig } = storeToRefs(config)

const activeNames = ref(['defaultStreamerSetting'])

const loading = ref(true)

const isConfigChanged = ref(false)

const { vod, record, general } = ConfigSystem.explanation

const { recordModeList, vodModeExplanation, wildcardExplanation } = ConfigSystem

const setRecordSaveDir = async () => {
  if (!userConfig.value) return

  const res = await getDirPath()

  if (!res) return

  userConfig.value.general.dirToSaveRecord = res
}

const saveConfig = async () => {
  if (!userConfig.value) return

  try {
    await config.setConfig(userConfig.value)

    notify.success('configuration saved successfully')

    isConfigChanged.value = false
  } catch (error) {
    console.error(error)

    notify.warn('fail to save configuration')
  }
}

const assignConfig = async (importData: Config) => {
  // TODO: data validation
  await config.setConfig(importData)
}

const importConfig = async () => await importJSON(assignConfig)

const exportConfig = async () =>
  await exportJSON(userConfig.value, 'config', 'Export Config')

const resumeConfig = async () => {
  try {
    userConfig.value = ConfigSystem.defaultSetting

    config.setConfig(userConfig.value)

    notify.success('resume default configuration successfully')
  } catch (error) {
    console.error(error)

    notify.warn('fail to resume default configuration')
  }
}

watch(
  userConfig,
  (newValue, oldValue) => {
    if (oldValue === undefined) return

    isConfigChanged.value = true
  },
  { deep: true }
)

onBeforeRouteLeave((to, from) => {
  if (!isConfigChanged.value) return

  const answer = window.confirm(
    'Do you really want to leave? you have unsaved changes!'
  )
  // cancel the navigation and stay on the same page
  if (!answer) return false
})

onMounted(async () => {
  loading.value = false
})
</script>

<style scoped>
:deep(.el-collapse-item) {
  --el-collapse-border-color: #576f72;
  --el-collapse-header-bg-color: #f0ebe3;
  --el-collapse-content-bg-color: #f0ebe3;
}

.el-switch {
  --el-switch-on-color: #576f72;
  /* --el-switch-off-color: #7D9D9C; */
  --el-switch-border-color: #7d9d9c;
}

.collapseTitle {
  @apply text-xl font-bold text-themeColor4;
}

.configContent {
  @apply flex flex-col gap-1;
}
</style>
