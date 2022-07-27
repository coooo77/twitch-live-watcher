import { defineStore } from 'pinia'
import FileSystem from '../util/file'
import ModelSystem from '../util/model'
import Download from '../util/download'
import AuthService from '../util/authService'
import DownloadSystem from '../util/download'
import StreamerSystem from '../util/streamers'
import { useNotification } from './notification'
import { FollowList, Streamer } from '../types/streamer'
import { getFollowedStreams, FollowedStream, getVideos } from '../api/user'

type MapList = Map<Streamer['user_id'], FollowedStream>

interface State {
  latestOnlineListMap: MapList
  checkTimer: number | null
  isWatchOnline: boolean
  haveToUpdateFollowList: boolean
  followList: FollowList
}

export default defineStore('followList', {
  state: () => {
    return {
      latestOnlineListMap: new Map(),
      checkTimer: null,
      isWatchOnline: false,
      haveToUpdateFollowList: false,
      followList: StreamerSystem.defaultFollowList
    } as State
  },
  getters: {
    latestOnlineList: (state) =>
      Array.from(state.latestOnlineListMap).map(([key, value]) => value)
  },
  actions: {
    async getFollowList() {
      try {
        this.followList = await ModelSystem.getFollowList()
      } catch (error) {
        FileSystem.errorHandler(error)
      } finally {
        return this.followList
      }
    },
    async setFollowList(followList?: FollowList) {
      try {
        if (!followList) return false

        await ModelSystem.setFollowList(followList)

        this.followList = followList

        return true
      } catch (error) {
        FileSystem.errorHandler(error)

        return false
      }
    },
    async getOnlineFollowList() {
      const user_id = await AuthService.getUserID()

      const liveStreams: FollowedStream[] = []

      let hasPagination = ''

      do {
        const paginationParam = hasPagination ? { after: hasPagination } : {}

        const res = await getFollowedStreams({
          user_id,
          ...paginationParam
        })

        const { data, pagination } = res

        liveStreams.push(...data)

        hasPagination = pagination.cursor || ''
      } while (hasPagination)

      return liveStreams
    },
    async getMapOnlineFollowList() {
      const latestOnlineList = await this.getOnlineFollowList()

      const mapList = new Map<Streamer['user_id'], FollowedStream>()

      for (const streamer of latestOnlineList) {
        if (!this.followList.streamers[streamer.user_id]) continue

        mapList.set(streamer.user_id, streamer)
      }

      return mapList
    },
    async setCheckOnlineTimer() {
      if (!this.isWatchOnline) return

      const config = await ModelSystem.getConfig()

      const { checkStreamInterval } = config.general

      try {
        await this.updateOnlineList()

        this.checkTimer = window.setTimeout(
          this.setCheckOnlineTimer,
          checkStreamInterval * 1000
        )
      } catch (error) {
        const err = error as { message: string }

        FileSystem.errorHandler(error)

        const notify = useNotification()

        notify.warn(err.message || 'Unknown error')

        this.isWatchOnline = false
      }
    },
    async clearTimer() {
      if (this.checkTimer !== null) clearTimeout(this.checkTimer)

      this.latestOnlineListMap.clear()

      await Download.abortAllDownloads()

      await this.clearOnlineList()
    },
    async clearOnlineList() {
      for (const user_id of Object.keys(this.followList.onlineList)) {
        if (!this.followList.streamers[user_id]) continue

        this.followList.streamers[user_id].status.isOnline = false

        this.followList.streamers[user_id].status.isRecording = false

        delete this.followList.streamers[user_id].status.onlineVodID

        delete this.followList.onlineList[user_id]
      }

      await this.setFollowList(this.followList)
    },
    async updateOnlineList() {
      this.latestOnlineListMap = await this.getMapOnlineFollowList()

      await this.handleStreamerOffline(this.latestOnlineListMap)

      await this.handleStreamerOnline(this.latestOnlineListMap)

      if (!this.haveToUpdateFollowList) return

      this.haveToUpdateFollowList = false

      await this.setFollowList(this.followList)
    },
    async handleStreamerOffline(mapList: MapList) {
      for (const user_id of Object.keys(this.followList.onlineList)) {
        const isStillOnline = mapList.get(user_id) !== undefined

        if (isStillOnline) continue

        mapList.delete(user_id)

        delete this.followList.onlineList[user_id]

        this.followList.streamers[user_id].status.isOnline = false

        if (this.followList.streamers[user_id].status.onlineVodID) {
          await DownloadSystem.updateVodList(user_id)

          delete this.followList.streamers[user_id].status.onlineVodID
        }
      }
    },
    async handleStreamerOnline(mapList: MapList) {
      for (const [user_id, stream] of Array.from(mapList)) {
        const streamer = this.followList.streamers[user_id]

        if (!streamer) continue

        const {
          enableRecord,
          checkStreamContentTypeEnable,
          checkStreamContentTypeTargetGameNames
        } = streamer.recordSetting

        const isValidTag = checkStreamContentTypeTargetGameNames
          .toLowerCase()
          .includes(stream.game_name.toLowerCase())

        await this.updateOnlineStatus(user_id, isValidTag)

        const { isRecording } = streamer.status

        const inValidGameName =
          checkStreamContentTypeEnable && stream.game_name && !isValidTag

        if (isRecording || inValidGameName || !enableRecord) continue

        const isRecordLiveStream = this.handleRecordLive(streamer)

        if (isRecordLiveStream) await DownloadSystem.recordLiveStream(stream)
      }
    },
    async updateOnlineStatus(user_id: string, isValidTag: boolean) {
      const isStillOnline = this.followList.onlineList[user_id] !== undefined

      if (isStillOnline) return

      const { enableNotify, vodEnableRecordVOD } =
        this.followList.streamers[user_id].recordSetting

      // TODO: if (enableNotify) handleNotify

      this.haveToUpdateFollowList = true

      if (vodEnableRecordVOD && isValidTag) {
        const vod = await getVideos({ user_id })

        const lastVOD = vod.data[0]

        const haveVod = !!(lastVOD?.thumbnail_url === '')

        if (haveVod) {
          this.followList.streamers[user_id].status.onlineVodID = lastVOD.id
        }
      }

      this.followList.onlineList[user_id] = user_id

      this.followList.streamers[user_id].status = {
        ...this.followList.streamers[user_id].status,
        isOnline: true,
        streamStartedAt: new Date().toJSON()
      }
    },
    handleRecordLive(streamer: Streamer) {
      const { user_id } = streamer

      const { vodGetStreamIfNoVod, vodIsStopRecordStream } =
        streamer.recordSetting

      const haveVod = this.followList.streamers[user_id].status.onlineVodID

      const haveVodAndStopRecord = haveVod && vodIsStopRecordStream

      const noVodAndStopRecord = !haveVod && !vodGetStreamIfNoVod

      const isStopRecordLive = noVodAndStopRecord || haveVodAndStopRecord

      return !isStopRecordLive
    }
  }
})
