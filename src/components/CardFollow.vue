<template>
  <div class="cardFollow">
    <div
      class="layout w-full grid grid-row-2 gap-1 border border-themeColor4 bg-themeColor2 rounded-lg generalShadow overflow-hidden"
    >
      <div class="left relative overflow-hidden border-b border-themeColor4">
        <div class="profile w-full h-0 pb-[100%] relative">
          <div
            class="profileImg bg-cover absolute inset-0 transition-transform duration-300 hover:scale-125"
            :style="{ 'background-image': `url(${profileImg})` }"
          />
        </div>
      </div>

      <div class="right px-4 pb-4 grid grid-rows-4 gap-1">
        <div class="userName relative">
          <div class="absolute inset-0">
            <div
              :title="displayName"
              class="text border-b-4 text-xl text-center text-themeColor4 font-bold truncate"
            >
              {{ displayName }}
            </div>
          </div>
        </div>

        <div class="record">
          <div class="controlText">Record</div>

          <el-switch :loading="isUpdatingStreamer" v-model="_enableRecord" />
        </div>

        <div class="vod">
          <div class="controlText">VOD</div>

          <el-switch :loading="isUpdatingStreamer" v-model="_enableNotify" />
        </div>

        <div class="notify">
          <div class="controlText">Notify</div>

          <el-switch
            :loading="isUpdatingStreamer"
            v-model="_vodEnableRecordVOD"
          />
        </div>

        <div class="controllers grid grid-cols-2 gap-2">
          <el-button
            class="min-w-full"
            color="#576F72"
            @click="$emit('editStreamer')"
          >
            <strong>EDIT</strong>
          </el-button>

          <el-popconfirm
            title="Are you sure to delete?"
            @confirm="$emit('deleteStreamer')"
          >
            <template #reference>
              <el-button class="min-w-full !ml-0" type="danger">
                <strong>DELETE</strong>
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Streamer } from '../types/streamer'

type KeyToUpdate = 'enableRecord' | 'enableNotify' | 'vodEnableRecordVOD'

const emit = defineEmits<{
  (eventName: 'editStreamer'): void
  (eventName: 'deleteStreamer'): void
  (eventName: 'updateStreamer', value: KeyToUpdate): void
}>()

const props = defineProps<{
  streamer: Streamer
  isUpdatingStreamer: boolean
}>()

const { profileImg, displayName, recordSetting } = toRefs(props.streamer)

const { enableRecord, enableNotify, vodEnableRecordVOD } = toRefs(
  recordSetting.value
)

const _enableRecord = computed({
  get() {
    return enableRecord.value
  },
  set(value) {
    emit('updateStreamer', 'enableRecord')
  }
})

const _enableNotify = computed({
  get() {
    return enableNotify.value
  },
  set(value) {
    emit('updateStreamer', 'enableNotify')
  }
})

const _vodEnableRecordVOD = computed({
  get() {
    return vodEnableRecordVOD.value
  },
  set(value) {
    emit('updateStreamer', 'vodEnableRecordVOD')
  }
})
</script>

<style scoped>
.record,
.vod,
.notify {
  @apply flex justify-between items-center;
}

.controlText {
  @apply text-themeColor4 font-bold text-lg;
}

:deep(.el-collapse-item) {
  --el-collapse-border-color: #576f72;
  --el-collapse-header-bg-color: #f0ebe3;
  --el-collapse-content-bg-color: #f0ebe3;
}

.el-switch {
  --el-switch-on-color: #576f72;
  --el-switch-off-color: #7d9d9c;
  --el-switch-border-color: #7d9d9c;
}
</style>
