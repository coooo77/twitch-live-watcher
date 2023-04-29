<template>
  <div
    class="pageView grid grid-rows-[min-content,1fr] gap-2"
  >
    <div class="controllers flex flex-nowrap gap-2 mb-2">
      <template v-if="follow.isWatchOnline">
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
        <el-scrollbar v-if="follow.latestOnlineList.length">
          <div class="cards grid gap-3 p-4">
            <CardLive
              v-for="stream of follow.latestOnlineList"
              :key="stream.id"
              :stream="stream"
              :isRecording="isRecording(stream.user_id)"
              :up-date-time="visitTime"
            />
          </div>
        </el-scrollbar>

        <NoData v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useFollow from '../store/follow'

const follow = useFollow()

const onlineListEl = ref<HTMLElement>()

const visitTime = ref(new Date())

const startOrStopApp = (value: boolean) => {
  follow.isWatchOnline = value
}

const isRecording = (user_id: string) => {
  return follow.followList.onlineList[user_id]?.isRecording || false
}

const checkVisitTime = () => {
  const timeNow = new Date()
  const isOver1Min = timeNow.getTime() - visitTime.value.getTime() > 60 * 1000
  const isVisible = document.visibilityState === 'visible'

  if (isOver1Min && isVisible) visitTime.value = timeNow
}

document.addEventListener('visibilitychange', checkVisitTime)

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', checkVisitTime)
})
</script>

<style scoped>
.cards {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5;
}
</style>
