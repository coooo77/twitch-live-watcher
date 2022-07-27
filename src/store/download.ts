import { defineStore } from 'pinia'
import FileSystem from '../util/file'
import ModelSystem from '../util/model'
import DownloadSystem from '../util/download'
import { DownloadList } from '../types/download'

export default defineStore('download', {
  state: () => {
    return { downloadList: DownloadSystem.defaultDownloadList }
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
    }
  }
})
