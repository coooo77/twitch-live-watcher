<template>
  <div
    class="pageView grid grid-rows-[min-content,1fr]"
    v-loading="loading"
    element-loading-background="transparent"
    element-loading-text="Loading..."
  >
    <div class="controllers mb-2 flex flex-wrap gap-y-2">
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
                    v-model="userConfigCloned.record.enableRecord"
                  />

                  <template #popIcon>
                    <Explanation :content="record.enableRecord" />
                  </template>
                </InputRow>

                <InputRow title="Enable Notify">
                  <el-switch
                    size="small"
                    v-model="userConfigCloned.record.enableNotify"
                  />

                  <template #popIcon>
                    <Explanation :content="record.enableNotify" />
                  </template>
                </InputRow>

                <InputRow title="Enable Record VOD">
                  <el-switch
                    size="small"
                    v-model="userConfigCloned.record.vodEnableRecordVOD"
                  />

                  <template #popIcon>
                    <Explanation :content="record.vodEnableRecordVOD" />
                  </template>
                </InputRow>

                <InputRow title="Is Stop Record Stream">
                  <el-switch
                    size="small"
                    v-model="userConfigCloned.record.vodIsStopRecordStream"
                  />

                  <template #popIcon>
                    <Explanation :content="record.vodIsStopRecordStream" />
                  </template>
                </InputRow>

                <InputRow title="Download If No Vod">
                  <el-switch
                    size="small"
                    v-model="userConfigCloned.record.vodGetStreamIfNoVod"
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
                      v-model="userConfigCloned.record.vodMode"
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
                      v-if="userConfigCloned.record.vodMode === 'countDown'"
                    >
                      <el-input-number
                        v-model="userConfigCloned.record.vodCountDownInMinutes"
                        :min="0"
                        :max="1440"
                        size="small"
                        controls-position="right"
                      />

                      <div class="font-bold text-themeColor4">minutes</div>
                    </template>

                    <template
                      v-else-if="userConfigCloned.record.vodMode === 'timeZone'"
                    >
                      <el-time-picker
                        v-model="userConfigCloned.record.vodTimeZone"
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
                          <el-table-column width="120" property="mode" label="Mode" />

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
                    v-model="userConfigCloned.record.vodFileNameTemplate"
                    placeholder="Filename Template For VOD"
                  />

                  <template #popIcon>
                    <Explanation :content="record.vodFileNameTemplate">
                      <template #popContent>
                        <el-table :data="wildcardExplanation">
                          <!-- prettier-ignore -->
                          <el-table-column width="auto" property="wildcard" label="Wildcard" />

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
                    v-model="userConfigCloned.record.fileNameTemplate"
                    placeholder="Filename Template For Live Record"
                  />

                  <template #popIcon>
                    <Explanation :content="record.fileNameTemplate">
                      <template #popContent>
                        <el-table :data="wildcardExplanation">
                          <!-- prettier-ignore -->
                          <el-table-column width="auto" property="wildcard" label="Wildcard" />

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
                    v-model="
                      userConfigCloned.record.checkStreamContentTypeEnable
                    "
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
                    v-model="userConfigCloned.record.abortInvalidRecord"
                  />

                  <template #popIcon>
                    <Explanation :content="record.abortInvalidRecord" />
                  </template>
                </InputRow>

                <InputRow title="Game Tag List">
                  <el-input
                    size="small"
                    v-model="
                      userConfigCloned.record
                        .checkStreamContentTypeTargetGameNames
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
                    v-model="userConfigCloned.general.checkStreamInterval"
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
                      v-model="userConfigCloned.general.dirToSaveRecord"
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
                    v-model="userConfigCloned.general.numOfDownloadLimit"
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
                    v-model="userConfigCloned.general.showDownloadCmd"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.showDownloadCmd" />
                  </template>
                </InputRow>

                <InputRow title="Close Cmd when stop">
                  <el-switch
                    size="small"
                    v-model="userConfigCloned.general.closeCmdWhenAppStop"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.closeCmdWhenAppStop" />
                  </template>
                </InputRow>

                <InputRow title="Automatically execute on program startup">
                  <el-switch
                    size="small"
                    v-model="userConfigCloned.general.autoExecuteOnStartup"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.autoExecuteOnStartup" />
                  </template>
                </InputRow>

                <InputRow title="Automatically execute on computer startup">
                  <el-switch
                    size="small"
                    v-model="
                      userConfigCloned.general.autoExecuteOnComputerStartup
                    "
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.autoExecuteOnComputerStartup" />
                  </template>
                </InputRow>

                <InputRow title="Ensure minimum of resolution">
                  <el-switch
                    size="small"
                    v-model="userConfigCloned.general.ensureMinResolution"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.ensureMinResolution" />
                  </template>
                </InputRow>

                <InputRow title="minimum acceptable video resolution">
                  <el-input-number
                    v-model="userConfigCloned.general.minResolutionThreshold"
                    :min="144"
                    :disabled="!userConfigCloned.general.ensureMinResolution"
                    size="small"
                    controls-position="right"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="general.minResolutionThreshold" />
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
                    v-model="userConfigCloned.vod.reTryDownloadInterval"
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
                    v-model="userConfigCloned.vod.maxReDownloadTimes"
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
                    v-model="userConfigCloned.vod.IntegrityCheck"
                  />

                  <!-- prettier-ignore -->
                  <template #popIcon>
                    <Explanation :content="vod.IntegrityCheck" />
                  </template>
                </InputRow>

                <InputRow
                  v-show="userConfigCloned.vod.IntegrityCheck"
                  title="Loss Duration Allowed"
                >
                  <el-input-number
                    v-model="userConfigCloned.vod.LossOfVODDurationAllowed"
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
import { ipcRenderer } from 'electron'
import useConfig from '../store/config'
import { Config } from '../types/config'
import ConfigSystem from '../util/config'
import { getDirPath } from '../util/common'
import { cloneDeep, isEqual } from 'lodash'
import { onBeforeRouteLeave } from 'vue-router'
import { handleJsonFile } from '../composable/common'
import { ElMessage, ElMessageBox } from 'element-plus'

const config = useConfig()

const { importJSON, exportJSON } = handleJsonFile()

const { userConfig } = storeToRefs(config)

const activeNames = ref(['defaultStreamerSetting'])

const loading = ref(true)

const userConfigCloned = ref(cloneDeep(userConfig.value))

const isConfigChanged = computed(
  () => !isEqual(userConfig.value, userConfigCloned.value)
)

const { vod, record, general } = ConfigSystem.explanation

const { recordModeList, vodModeExplanation, wildcardExplanation } = ConfigSystem

const setRecordSaveDir = async () => {
  if (!userConfigCloned.value) return

  const res = await getDirPath()
  if (!res) return

  userConfigCloned.value.general.dirToSaveRecord = res
}

const saveConfig = async () => {
  if (!userConfigCloned.value) return

  try {
    await config.setConfig(userConfigCloned.value)

    ElMessage({
      message: 'configuration saved successfully',
      type: 'success'
    })

    ipcRenderer.send(
      'setAutoExeOnComputerStartup',
      config.userConfig.general.autoExecuteOnComputerStartup
    )
  } catch (error) {
    console.error(error)

    ElMessage({
      message: 'fail to save configuration',
      type: 'error'
    })
  }
}

const assignConfig = async (importData: Config) => {
  // TODO: data validation
  await config.setConfig(importData)
}

const importConfig = async () => {
  await importJSON(assignConfig)

  await saveConfig()

  userConfigCloned.value = cloneDeep(userConfig.value)
}

const exportConfig = async () =>
  await exportJSON(userConfig.value, 'config', 'Export Config')

const resumeConfig = async () => {
  try {
    userConfigCloned.value = ConfigSystem.defaultSetting

    config.setConfig(userConfigCloned.value)

    ElMessage({
      message: 'resume default configuration successfully',
      type: 'success'
    })
  } catch (error) {
    console.error(error)

    ElMessage({
      message: 'fail to resume default configuration',
      type: 'error'
    })
  }
}

onBeforeRouteLeave(async (to, from) => {
  if (!isConfigChanged.value) return

  try {
    await ElMessageBox.confirm(
      'Do you really want to leave? you have unsaved changes!'
    )
    return true
  } catch (error) {
    // cancel the navigation and stay on the same page
    return false
  }
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
