<template>
  <div
    class="pageView grid grid-rows-[min-content,1fr] gap-2"
    v-loading="loading"
    element-loading-background="transparent"
    element-loading-text="Loading..."
  >
    <div class="controllers flex flex-nowrap gap-2 mb-2">
      <template v-if="followList.isWatchOnline">
        <el-popconfirm
          title="Are you sure to STOP app?"
          @confirm="startOrStopApp(false)"
        >
          <template #reference>
            <el-button type="danger">
              <strong>STOP APP</strong>
            </el-button>
          </template>
        </el-popconfirm>
      </template>

      <template v-else>
        <el-button color="#576F72" @click="startOrStopApp(true)">
          <strong>START APP</strong>
        </el-button>
      </template>
    </div>

    <div class="onlineList relative">
      <div ref="onlineListEl" class="onlineListEl absolute inset-0">
        <el-scrollbar v-if="followList.latestOnlineList.length">
          <div class="cards grid gap-3 p-4">
            <CardLive
              v-for="stream of followList.latestOnlineList"
              :key="stream.id"
              :stream="stream"
              :isRecording="isRecording(stream.user_id)"
              :hideAbortBtn="hideAbortBtn"
            />
          </div>

          <Observer
            :hideObserver="loading || hideObserver"
            :observeTarget="onlineListEl"
          />
        </el-scrollbar>

        <NoData v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ModelSystem from '../util/model'
import useFollowList from '../store/followList'

const loading = ref(true)

const followList = useFollowList()

const onlineListEl = ref<HTMLElement>()

const hideObserver = ref(true)

const hideAbortBtn = ref(false)

const startOrStopApp = (value: boolean) => {
  followList.isWatchOnline = value
}

const isRecording = (user_id: string) => {
  return followList.followList.streamers[user_id]?.status.isRecording || false
}

onMounted(async () => {
  try {
    const config = await ModelSystem.getConfig()

    hideAbortBtn.value = config.general.showDownloadCmd
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.cards {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5;
}
</style>
