<script setup lang="ts">
// import './samples/node-api'
import { storeToRefs } from 'pinia'
import useFollow from './store/follow'
import useConfig from './store/config'
import useDownload from './store/download'
import Notification from './components/Notification.vue'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup

const route = useRoute()

const config = useConfig()

const follow = useFollow()

const download = useDownload()

const { isWatchOnline } = storeToRefs(follow)

watch(isWatchOnline, (newVal, oldVal) => {
  if (newVal) {
    follow.setCheckOnlineTimer()

    download.setCheckDownloadTimer()
  } else {
    follow.clearTimer()

    download.clearTimer()
  }
})

onMounted(async () => {
  await Promise.all([
    config.getConfig(),
    follow.getFollowList(),
    download.getDownloadList()
  ])
})

window.onbeforeunload = (event) => {
  const haveToClearFollow =
    follow.haveToClearOnlineList || download.haveToClearLiveStreams

  const haveToClearDownload = download.haveToClearVodOnGoing

  if (haveToClearFollow && haveToClearDownload) {
    Promise.all([follow.clearTimer(), download.clearTimer()])

    return null
  }

  if (haveToClearFollow) {
    follow.clearTimer()

    return null
  }

  if (haveToClearDownload) {
    download.clearTimer()

    return null
  }
}

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
