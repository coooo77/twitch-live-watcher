import useConfig from './config'
import { defineStore } from 'pinia'
import FileSystem from '../util/file'
import ModelSystem from '../util/model'
import DownloadSystem from '../util/download'
import { useNotification } from './notification'
import { DownloadItem, DownloadList } from '../types/download'

interface State {
  haveToUpdateStore: boolean
  checkTimer: number | null
  downloadList: DownloadList
}

export default defineStore('download', {
  state: () => {
    return {
      checkTimer: null,
      haveToUpdateStore: false,
      downloadList: DownloadSystem.defaultDownloadList
    } as State
  },
  getters: {
    isQueueTypeOccupied: (state) =>
      state.downloadList.vodList.onGoing.some((task) => task.mod === 'queue'),
    haveToClearLiveStreams: (state) =>
      Object.keys(state.downloadList.liveStreams).length !== 0,
    haveToClearVodOnGoing: (state) =>
      Object.keys(state.downloadList.vodList.onGoing).length !== 0
  },
  actions: {
    async getDownloadList() {
      try {
        this.downloadList = await ModelSystem.getDownloadedList()
      } catch (error) {
        FileSystem.errorHandler(error)
      } finally {
        return this.downloadList
      }
    },
    async setDownloadList(list?: DownloadList) {
      try {
        if (!list) {
          await ModelSystem.setDownloadList(this.downloadList)
        } else {
          await ModelSystem.setDownloadList(list)

          this.downloadList = list
        }

        return true
      } catch (error) {
        FileSystem.errorHandler(error)

        return false
      }
    },
    async setCheckDownloadTimer() {
      const config = useConfig()

      const { checkStreamInterval } = config.userConfig.general

      try {
        await this.handleDownloadVOD()

        this.checkTimer = window.setTimeout(
          this.setCheckDownloadTimer,
          checkStreamInterval * 1000
        )
      } catch (error) {
        const err = error as { message: string }

        FileSystem.errorHandler(error)

        console.error(error)

        const notify = useNotification()

        notify.warn(err.message || 'Unknown error')

        await this.clearTimer()
      }
    },
    async clearTimer() {
      if (this.checkTimer !== null) clearTimeout(this.checkTimer)

      await DownloadSystem.abortAllOngoingVod()
    },
    async handleDownloadVOD() {
      const list = this.downloadList.vodList

      for (const task of list.queue) {
        const isInvalidQueue = task.mod === 'queue' && this.isQueueTypeOccupied

        const taskTime = this.getTaskTime(task)

        const isInvalidTime = new Date() < taskTime

        if (isInvalidQueue || isInvalidTime) continue

        await this.moveTask(task, 'queue', 'onGoing')

        if (task.mod === 'timeZone') {
          await this.handleTimeZone(task)
        } else {
          const timeNow = new Date()

          const taskTime = new Date(task.validDownloadTime)

          if (timeNow < taskTime) continue

          await DownloadSystem.recordVod(task)
        }
      }

      if (this.haveToUpdateStore) {
        await this.setDownloadList()

        this.haveToUpdateStore = false
      }
    },
    async moveTask(
      item: DownloadItem,
      from: 'queue' | 'onGoing' | 'success' | 'error',
      to: 'queue' | 'onGoing' | 'success' | 'error',
      useTimerUpdate = true
    ) {
      const index = this.downloadList.vodList[from].findIndex(
        (i) => i.videoID === item.videoID
      )

      if (index === -1) return false

      switch (to) {
        case 'queue':
          this.downloadList.vodList[from][index].status = 'Queue'
          break
        case 'onGoing':
          this.downloadList.vodList[from][index].status = 'Downloading'
          break
        case 'success':
          this.downloadList.vodList[from][index].status = 'Success'
          break
        case 'error':
          this.downloadList.vodList[from][index].status = 'Cancelled'
          break
        default:
          break
      }

      this.downloadList.vodList[to].push(
        Object.assign({}, this.downloadList.vodList[from][index])
      )

      this.downloadList.vodList[from].splice(index, 1)

      if (useTimerUpdate) {
        this.haveToUpdateStore = true
      } else {
        await this.setDownloadList()
      }

      return true
    },
    async handleTimeZone(item: DownloadItem) {
      const timeNow = new Date()

      const taskTime = new Date(item.validDownloadTime)

      const dayNow = timeNow.getDate()

      const validTime = new Date(taskTime.setDate(dayNow))

      if (timeNow < validTime) return

      await DownloadSystem.recordVod(item)
    },
    getTaskTime(item: DownloadItem) {
      let correctTime = new Date(item.validDownloadTime)

      if (item.mod === 'timeZone') {
        const timeNow = new Date()

        const hour = correctTime.getHours()

        const min = correctTime.getMinutes()

        const sec = correctTime.getSeconds()

        correctTime = new Date(timeNow.setHours(hour, min, sec))
      }

      return correctTime
    }
  }
})
