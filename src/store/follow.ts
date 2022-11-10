import useConfig from './config'
import { defineStore } from 'pinia'
import useDownload from './download'
import FileSystem from '../util/file'
import { ipcRenderer } from 'electron'
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
      Array.from(state.latestOnlineListMap).map(([key, value]) => value),
    haveToClearOnlineList: (state) =>
      Object.keys(state.followList.onlineList).length !== 0
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
        if (!followList) {
          await ModelSystem.setFollowList(this.followList)
        } else {
          await ModelSystem.setFollowList(followList)

          this.followList = followList
        }

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

      const config = useConfig()

      const { checkStreamInterval } = config.userConfig.general

      try {
        await this.updateOnlineList()
      } catch (error) {
        const err = error as { message: string }

        FileSystem.errorHandler(error)

        const notify = useNotification()

        notify.warn(err.message || 'Unknown error')
      } finally {
        this.checkTimer = window.setTimeout(
          this.setCheckOnlineTimer,
          checkStreamInterval * 1000
        )
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
      const config = useConfig()

      const limit = config.userConfig.general.numOfDownloadLimit

      const download = useDownload()

      for (const [user_id, stream] of Array.from(mapList)) {
        const streamer = this.followList.streamers[user_id]

        if (!streamer) continue

        const {
          enableRecord,
          vodEnableRecordVOD,
          checkStreamContentTypeEnable,
          checkStreamContentTypeTargetGameNames
        } = streamer.recordSetting

        const isValidTag = checkStreamContentTypeTargetGameNames
          .toLowerCase()
          .includes(stream.game_name.toLowerCase())

        const isValidGameName = checkStreamContentTypeEnable
          ? Boolean(stream.game_name && isValidTag)
          : true

        await this.updateOnlineStatus(stream, isValidGameName)

        const { isRecording } = streamer.status

        const isReachDownloadLimit =
          limit > 0 &&
          Object.keys(download.downloadList.liveStreams).length + 1 > limit

        const isStopRecordDueToVod = this.checkVodToStopRecord(streamer)

        const isUnableToRecord =
          isRecording ||
          !enableRecord ||
          !isValidGameName ||
          isStopRecordDueToVod ||
          isReachDownloadLimit

        if (isUnableToRecord) continue

        const { onlineVodID } = this.followList.streamers[user_id].status

        const haveToCheckVodID =
          !onlineVodID && vodEnableRecordVOD && isValidGameName

        if (haveToCheckVodID) await this.updateVodID(user_id)

        await DownloadSystem.recordLiveStream(stream)
      }
    },
    async updateOnlineStatus(stream: FollowedStream, isValidTag: boolean) {
      const { user_id, user_login, user_name } = stream

      const isStillOnline = this.followList.onlineList[user_id] !== undefined

      if (isStillOnline) return

      const { enableNotify, vodEnableRecordVOD } =
        this.followList.streamers[user_id].recordSetting

      if (enableNotify) {
        ipcRenderer.send('notify:online', {
          streamer: this.followList.streamers[user_id].displayName,
          timeAt: new Date().toLocaleString()
        })
      }

      this.haveToUpdateFollowList = true

      if (vodEnableRecordVOD && isValidTag) {
        // FIXME: online without VOD, but actually it has
        await this.updateVodID(user_id)
      }

      this.followList.onlineList[user_id] = user_id

      this.followList.streamers[user_id].status = {
        ...this.followList.streamers[user_id].status,
        isOnline: true,
        streamStartedAt: new Date().toJSON()
      }

      this.followList.streamers[user_id].user_login = user_login

      this.followList.streamers[user_id].displayName = user_name
    },
    checkVodToStopRecord(streamer: Streamer) {
      const { user_id } = streamer

      const { vodEnableRecordVOD, vodGetStreamIfNoVod, vodIsStopRecordStream } =
        streamer.recordSetting

      if (!vodEnableRecordVOD) return false

      const haveVod = this.followList.streamers[user_id].status.onlineVodID

      const haveVodAndStopRecord = Boolean(haveVod && vodIsStopRecordStream)

      const noVodAndStopRecord = Boolean(!haveVod && !vodGetStreamIfNoVod)

      const isStopRecordLive = noVodAndStopRecord || haveVodAndStopRecord

      return isStopRecordLive
    },
    async updateVodID(user_id: string) {
      const vod = await getVideos({ user_id })

      const lastVOD = vod.data[0]

      const haveVod = !!(lastVOD?.thumbnail_url === '')

      if (haveVod) {
        this.followList.streamers[user_id].status.onlineVodID = lastVOD.id
      }
    }
  }
})
