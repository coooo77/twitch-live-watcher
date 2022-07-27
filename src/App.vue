<script setup lang="ts">
// import './samples/node-api'
import { storeToRefs } from 'pinia'
import useFollowList from './store/followList'
import useDownloadList from './store/download'
import Notification from './components/Notification.vue'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
const route = useRoute()

const followList = useFollowList()

const downloadList = useDownloadList()

const { isWatchOnline } = storeToRefs(followList)

watch(isWatchOnline, (newVal, oldVal) => {
  if (newVal) {
    followList.setCheckOnlineTimer()
  } else {
    followList.clearTimer()
  }
})

onMounted(async () => {
  await Promise.all([
    followList.getFollowList(),
    downloadList.getDownloadList()
  ])
})

/**
 * TODO:
 * save config to store
 * empty event
 */
</script>

<template>
  <Layout>
    <Menu />
    <div class="pageView grow grid grid-rows-[min-content,1fr]">
      <div
        class="pageTitle select-none border-b-[9px] text-[72px] font-bold text-themeColor4 leading-[90px] mb-4"
      >
        {{ route.meta.title }}
      </div>
      <RouterView />
    </div>
  </Layout>

  <Notification />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
</style>
