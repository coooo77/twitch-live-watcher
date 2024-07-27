<script setup lang="ts">
// import './samples/node-api'
import { storeToRefs } from 'pinia'
import { ipcRenderer } from 'electron'
import useFollow from './store/follow'
import useConfig from './store/config'
import useDownload from './store/download'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup

const route = useRoute()

const config = useConfig()

const follow = useFollow()

const download = useDownload()

const { isWatchOnline } = storeToRefs(follow)

const openDev = () => ipcRenderer.send('open:devTool')

watch(isWatchOnline, (newVal, oldVal) => {
  follow.clearTimer()

  download.clearTimer()

  if (!newVal) return

  follow.setCheckOnlineTimer()

  download.setCheckDownloadTimer()
})

const isAuthorized = ref(false)

const isLoadingApp = ref(true)

watch(isAuthorized, async (value) => {
  if (!value) return

  try {
    isLoadingApp.value = true

    await Promise.all([
      config.getConfig(),
      follow.getFollowList(),
      download.getDownloadList()
    ])

    isWatchOnline.value = config.userConfig.general.autoExecuteOnStartup
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingApp.value = false
  }
})

onMounted(async () => {
  try {
    isAuthorized.value = await ipcRenderer.invoke('init:app')
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingApp.value = false
  }
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

/* login twitch */
ipcRenderer.on('authStatus', (event, arg) => (isAuthorized.value = arg))

const openLoginPage = () => ipcRenderer.send('open:auth')

/**
 * TODO:
 * save config to store
 * empty event
 */
</script>

<template>
  <Layout>
    <template v-if="!isAuthorized">
      <div class="absolute inset-0 flex pointer-events-none">
        <div class="flex flex-col items-center gap-y-4 m-auto">
          <template v-if="isLoadingApp">
            <div
              class="font-bold text-2xl text-themeColor4 tracking-wider px-2 text-center"
            >
              Initiation App ...
            </div>
          </template>

          <template v-else>
            <div
              class="font-bold text-2xl text-themeColor4 tracking-wider px-2 text-center"
            >
              Authorization required, login first
            </div>
            <el-button
              color="#576F72"
              class="tracking-wider text-lg pointer-events-auto"
              type="primary"
              size="large"
              @click="openLoginPage"
              >Login Twitch
            </el-button>
          </template>
        </div>
      </div>
    </template>

    <template v-else>
      <Menu />
      <div class="pageView grow grid grid-rows-[min-content,1fr]">
        <div
          class="pageTitle select-none border-b-[9px] text-[50px] font-bold text-themeColor4 leading-[60px] mb-4 sm:text-[72px] sm:leading-[90px]"
          @click.ctrl.shift="openDev"
        >
          {{ route.meta.title }}
        </div>
        <RouterView />
      </div>
    </template>
  </Layout>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
</style>
