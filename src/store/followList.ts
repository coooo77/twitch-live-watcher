import { defineStore } from 'pinia'
import FileSystem from '../util/file'
import ModelSystem from '../util/model'
import { FollowList } from '../types/streamer'
import StreamerSystem from '../util/streamers'

export default defineStore('followList', {
  state: () => {
    return {
      isWatchOnline: false,
      followList:StreamerSystem.defaultFollowList
    }
  },
  actions: {
    async getFollowList() {
      try {
        this.followList = await ModelSystem.getFollowList()
      } catch (error) {
        FileSystem.errorHandler(error)
      }
    },
    async setFollowList(followList?: FollowList) {
      try {
        if (!followList) return false

        await ModelSystem.setFollowList(followList)

        return true
      } catch (error) {
        FileSystem.errorHandler(error)

        return false
      }
    }
  }
})