import path from 'path'
import cp from 'child_process'
import { killProcess } from './common'
import useConfig from '../store/config'
import useFollow from '../store/follow'
import { Config } from 'src/types/config'
import useDownload from '../store/download'
import { Streamer } from '../types/streamer'
import { DownloadItem, DownloadList } from '../types/download'
import { FollowedStream, getFullVideos, IVod } from '../api/user'

export default class Download {
  static filename = 'download'

  static defaultDownloadList: DownloadList = {
    liveStreams: {},
    vodList: {
      queue: [],
      onGoing: [],
      success: [],
      error: []
    }
  }

  static async recordLiveStream(stream: FollowedStream) {
    const follow = useFollow()

    const config = useConfig()

    const streamer = follow.followList.streamers[stream.user_id]

    const cmd = Download.getCmd(streamer, stream, config.userConfig)

    let task: null | cp.ChildProcess = cp.exec(cmd)

    task.on('spawn', async () => {
      await Promise.all([
        Download.addDownloadRecord(stream, task?.pid),
        Download.updateStreamerStatus(stream, true)
      ])
    })

    task.on('close', async (code: number) => {
      await Promise.all([
        Download.removeDownloadRecord(stream),
        Download.updateStreamerStatus(stream, false)
      ])

      task?.off('spawn', () => {})

      task?.off('exit', () => {})

      task = null
    })
  }

  static getCmd(streamer: Streamer, stream: FollowedStream, config: Config) {
    const { user_login, recordSetting } = streamer

    const sourceUrl = `https://www.twitch.tv/${user_login}`

    const filename = Download.getStreamFilename(
      recordSetting.fileNameTemplate,
      stream
    )

    const filePath = Download.getExportPath(config, filename)

    const { showDownloadCmd } = config.general

    // prettier-ignore
    return `${showDownloadCmd ? 'start ' : ''}streamlink ${sourceUrl} best -o ${filePath}.mp4`
  }

  static checkStatus(limit: number, downloadList: DownloadList) {
    const currentDownload = Object.values(downloadList.liveStreams)

    const hasLimit = limit > 0

    const isReachLimit = currentDownload.length + 1 > limit

    return !(hasLimit && isReachLimit)
  }

  static getStreamFilename(template: string, stream: FollowedStream) {
    const startTime = new Date().toJSON()

    const string = template
      .replace('{id}', stream.id)
      .replace('{streamer}', stream.user_login)
      .replace('{title}', stream.title)

    return Download.getFileTimeName(string, startTime)
  }

  static getVodFilename(template: string, vod: IVod) {
    const string = template
      .replace('{id}', vod.id)
      .replace('{streamer}', vod.user_login)
      .replace('{title}', vod.title)
      .replace('{duration}', vod.duration)

    return Download.getFileTimeName(string, vod.published_at)
  }

  static getFileTimeName(template: string, time: string) {
    const targetTime = new Date(time)

    return template
      .replace('{year}', String(targetTime.getFullYear()).padStart(2, '0'))
      .replace('{month}', String(targetTime.getMonth() + 1).padStart(2, '0'))
      .replace('{day}', String(targetTime.getDay()).padStart(2, '0'))
      .replace('{hr}', String(targetTime.getHours()).padStart(2, '0'))
      .replace('{min}', String(targetTime.getMinutes()).padStart(2, '0'))
      .replace('{sec}', String(targetTime.getSeconds()).padStart(2, '0'))
  }

  static getExportPath(config: Config, filename: string) {
    return path.join(config.general.dirToSaveRecord, filename)
  }

  static async addDownloadRecord(stream: FollowedStream, pid?: number) {
    const download = useDownload()

    download.downloadList.liveStreams[stream.id] = {
      pid,
      user_id: stream.user_id,
      user_login: stream.user_login,
      startAt: new Date().toJSON()
    }

    await download.setDownloadList()
  }

  static async removeDownloadRecord(stream: FollowedStream) {
    const download = useDownload()

    if (download.downloadList.liveStreams[stream.id] === undefined) return

    delete download.downloadList.liveStreams[stream.id]

    await download.setDownloadList()
  }

  static async updateStreamerStatus(stream: FollowedStream, status: boolean) {
    const follow = useFollow()

    if (follow.followList.streamers[stream.user_id] === undefined) return

    follow.followList.streamers[stream.user_id].status.isRecording = status

    await follow.setFollowList()
  }

  static async abortAllDownloads() {
    const download = useDownload()

    const downloadList = await download.getDownloadList()

    for (const item of Object.values(downloadList.liveStreams)) {
      if (item.pid !== undefined) killProcess(item.pid)
    }

    downloadList.liveStreams = {}

    await download.setDownloadList(downloadList)
  }

  static async abortLiveRecord(stream: FollowedStream) {
    const follow = useFollow()

    const download = useDownload()

    if (follow.followList.streamers[stream.user_id]) {
      follow.followList.streamers[stream.user_id].status.isRecording = false
    }

    if (download.downloadList.liveStreams[stream.id]) {
      const { pid } = download.downloadList.liveStreams[stream.id]

      if (pid !== undefined) killProcess(pid)

      delete download.downloadList.liveStreams[stream.id]
    }

    await Promise.all([follow.setFollowList(), download.setDownloadList()])
  }

  static async updateVodList(user_id: string) {
    const follow = useFollow()

    const streamer = follow.followList.streamers[user_id]

    if (!streamer) return

    const videos = await Download.getVod(user_id, streamer.status.onlineVodID)

    if (videos.length === 0) return

    const downloadItems = Download.vodToDownloadItem(videos, streamer)

    const download = useDownload()

    const list = download.downloadList

    list.vodList.queue.push(...downloadItems)

    await download.setDownloadList(list)
  }

  static async getVod(user_id: string, startID?: string) {
    const videos = await getFullVideos({ user_id })

    return startID
      ? videos.filter((video) => Number(video.id) >= Number(startID))
      : videos
  }

  static vodToDownloadItem(videos: IVod[], streamer: Streamer): DownloadItem[] {
    return videos.map((video) => ({
      videoID: video.id,
      createdTime: new Date().toJSON(),
      validDownloadTime: Download.getValidTime(streamer),
      mod: streamer.recordSetting.vodMode,
      retryTimes: 0,
      url: video.url,
      filename: Download.getVodFilename(
        streamer.recordSetting.vodFileNameTemplate,
        video
      ),
      user_login: video.user_login,
      status: 'Queue',
      thumbnail_url: video.thumbnail_url,
      title: video.title
    }))
  }

  static getValidTime(streamer: Streamer) {
    const { vodMode, vodTimeZone, vodCountDownInMinutes } =
      streamer.recordSetting

    switch (vodMode) {
      case 'countDown':
        return new Date(
          new Date().getTime() + vodCountDownInMinutes * 1000 * 60
        ).toJSON()

      case 'timeZone':
        const timeNow = new Date()

        const timeZone = new Date(vodTimeZone)

        const isExpired = timeZone >= timeNow

        const day = isExpired ? timeNow.getDay() + 1 : timeNow.getDay()

        const hour = timeZone.getHours()

        const min = timeZone.getMinutes()

        const sec = timeZone.getSeconds()

        return new Date(
          timeNow.getFullYear(),
          timeNow.getHours(),
          day,
          hour,
          min,
          sec
        ).toJSON()

      case 'queue':
      default:
        return new Date().toJSON()
    }
  }
}
