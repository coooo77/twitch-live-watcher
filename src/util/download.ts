import fs from 'fs'
import path from 'path'
import cp from 'child_process'
import FileSystem from './file'
import { killProcess } from './common'
import useConfig from '../store/config'
import useFollow from '../store/follow'
import useDownload from '../store/download'
import { Streamer } from '../types/streamer'
import { Config, GeneralSetting } from '../types/config'
import { DownloadItem, DownloadList } from '../types/download'
import { FollowedStream, getFullVideos, IVod } from '../api/user'

interface LiveCheckTimer {
  [key: FollowedStream['user_id']]: NodeJS.Timeout
}

export default class Download {
  static filename = 'download'

  static liveCheckTimer: LiveCheckTimer = {}

  static defaultDownloadList: DownloadList = {
    liveStreams: {},
    vodList: {
      queue: [],
      onGoing: [],
      success: [],
      error: []
    }
  }

  static async recordLiveStream(stream: FollowedStream, retry = 0) {
    try {
      const config = useConfig()

      const { general } = config.userConfig

      FileSystem.makeDirIfNotExist(general.dirToSaveRecord)

      const { cmd, filePath } = Download.getCmd(stream, general)

      let task: null | cp.ChildProcess = cp.exec(cmd)

      task.on('spawn', async () => {
        // FIXME: Unknown reason stopping download live stream、stream end causes cmd spawn error
        Download.liveCheckTimer[stream.user_id] = setTimeout(async () => {
          Download.clearLiveCheckTimer(stream.user_id)

          if (fs.existsSync(filePath)) return

          if (retry === 5) {
            const payload = {
              stream,
              message: 'reach max retry limit'
            }

            throw Error(JSON.stringify(payload))
          }

          await Download.abortLiveRecord(stream)

          await Download.recordLiveStream(stream, ++retry)
        }, 60 * 1000)

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

        task?.off('close', () => {})

        task = null
      })
    } catch (error) {
      FileSystem.errorHandler(error)

      throw error
    }
  }

  static getCmd(stream: FollowedStream, general: GeneralSetting) {
    const follow = useFollow()

    const streamer = follow.followList.streamers[stream.user_id]

    const { user_login, recordSetting } = streamer

    const sourceUrl = `https://www.twitch.tv/${user_login}`

    const filename = Download.getStreamFilename(
      recordSetting.fileNameTemplate,
      stream
    )

    const filePath = path.join(general.dirToSaveRecord, `${filename}.ts`)

    const showCmd = `${general.showDownloadCmd ? 'start ' : ''}`

    const cmd = `${showCmd}streamlink --twitch-disable-hosting ${sourceUrl} best -o ${filePath}`

    return { cmd, filePath }
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
      .replace('{streamer_id}', stream.user_id)
      .replace('{id}', stream.id)
      .replace('{streamer}', stream.user_login)
      .replace('{title}', stream.title)

    return Download.getFileTimeName(string, startTime)
  }

  static getVodFilename(template: string, vod: IVod) {
    const string = template
      .replace('{streamer_id}', vod.user_id)
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
      .replace('{day}', String(targetTime.getDate()).padStart(2, '0'))
      .replace('{hr}', String(targetTime.getHours()).padStart(2, '0'))
      .replace('{min}', String(targetTime.getMinutes()).padStart(2, '0'))
      .replace('{sec}', String(targetTime.getSeconds()).padStart(2, '0'))
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

    for (const item of Object.values(download.downloadList.liveStreams)) {
      if (item.pid !== undefined) killProcess(item.pid)
    }

    download.downloadList.liveStreams = {}

    await download.setDownloadList()
  }

  static async abortLiveRecord(stream: FollowedStream) {
    Download.clearLiveCheckTimer(stream.user_id)

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
      title: video.title,
      duration: video.duration
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

        const day = isExpired ? timeNow.getDate() + 1 : timeNow.getDate()

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

  static getMediaDuration(
    videoPath: string,
    showInSeconds = true
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const options = `-v error${
          showInSeconds ? ' ' : ' -sexagesimal '
        }-show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoPath}`

        const task = cp.spawn('ffprobe', options.split(' '))

        task.stdout.on('data', (msg) => {
          resolve(Number(msg.toString()))
        })

        task.stderr.on('data', (msg) => {
          throw new Error(msg.toString())
        })
      } catch (error) {
        FileSystem.errorHandler(error)

        resolve(-1)
      }
    })
  }

  static stringDurationToSec(duration: string) {
    const time = {
      hour: 0,
      min: 0,
      sec: 0
    }

    const string = duration.toLowerCase()

    let number = ''

    for (let i = 0; i < string.length; i++) {
      if (string[i] === 'h') {
        time.hour = Number(number)

        number = ''
      } else if (string[i] === 'm') {
        time.min = Number(number)

        number = ''
      } else if (string[i] === 's') {
        time.sec = Number(number)

        number = ''
      } else {
        number += string[i]
      }
    }

    const { hour, min, sec } = time

    return hour * 60 * 60 + min * 60 + sec
  }

  static async recordVod(item: DownloadItem) {
    const { userConfig } = useConfig()

    const baseDir = item.dirToSaveRecord || userConfig.general.dirToSaveRecord

    FileSystem.makeDirIfNotExist(baseDir)

    const filePath = path.join(baseDir, `${item.filename}.ts`)

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    const cmd = Download.getVodCmd(item, filePath, userConfig)

    let task: null | cp.ChildProcess = cp.exec(cmd)

    task.on('spawn', async () => {
      await Download.updateOngoing(item, task?.pid)
    })

    task.on('close', async (code: number) => {
      task?.off('spawn', () => {})

      task?.off('close', () => {})

      task = null

      if (code === 1 || !fs.existsSync(filePath)) {
        return await Download.handleFailure(item)
      }

      const isSuccess = await Download.checkDownload(filePath, item)

      if (isSuccess) {
        await Download.handleSuccess(item)
      } else {
        await Download.handleFailure(item)
      }
    })
  }

  static async handleSuccess(item: DownloadItem) {
    const download = useDownload()

    await download.moveTask(item, 'onGoing', 'success', false)
  }

  static async handleFailure(item: DownloadItem) {
    const config = useConfig()

    const download = useDownload()

    const { reTryDownloadInterval, maxReDownloadTimes } = config.userConfig.vod

    if (item.retryTimes + 1 > maxReDownloadTimes) {
      await download.moveTask(item, 'onGoing', 'error', false)
    } else {
      const index = download.downloadList.vodList.onGoing.findIndex(
        (i) => i.videoID === item.videoID
      )

      if (index === -1) return

      download.downloadList.vodList.onGoing[index].retryTimes++

      download.downloadList.vodList.onGoing[index].validDownloadTime = new Date(
        Date.now() + reTryDownloadInterval * 60 * 1000
      ).toJSON()

      await download.moveTask(item, 'onGoing', 'queue', false)
    }
  }

  static getVodCmd(item: DownloadItem, filePath: string, config: Config) {
    const { url } = item

    const showCmd = `${config.general.showDownloadCmd ? 'start ' : ''}`

    return `${showCmd}streamlink ${url} best -o ${filePath}`
  }

  static async checkDownload(filepath: string, item: DownloadItem) {
    const config = useConfig()

    const { IntegrityCheck, LossOfVODDurationAllowed } = config.userConfig.vod

    if (!IntegrityCheck) return true

    const dataDuration = Download.stringDurationToSec(item.duration)

    const fileDuration = await Download.getMediaDuration(filepath)

    if (fileDuration === -1) return true

    return dataDuration - fileDuration <= LossOfVODDurationAllowed
  }

  static async updateOngoing(item: DownloadItem, pid?: number) {
    const download = useDownload()

    const index = download.downloadList.vodList.onGoing.findIndex(
      (i) => i.videoID === item.videoID
    )

    if (index === -1) return

    download.downloadList.vodList.onGoing[index].pid = pid

    await download.setDownloadList()
  }

  static async abortAllOngoingVod() {
    const download = useDownload()

    const { onGoing } = download.downloadList.vodList

    for (const item of onGoing) {
      if (item.pid !== undefined) killProcess(item.pid)

      item.status = 'Queue'
    }

    download.downloadList.vodList.queue = Object.assign(
      download.downloadList.vodList.queue,
      download.downloadList.vodList.onGoing
    )

    download.downloadList.vodList.onGoing = []

    await download.setDownloadList()
  }

  static async reTryVodDownload(item: DownloadItem) {
    const download = useDownload()

    const isSuccess = await download.moveTask(item, 'error', 'onGoing', false)

    if (!isSuccess) return

    await download.setDownloadList()

    await Download.recordVod(item)
  }

  static async cancelVodDownload(item: DownloadItem) {
    const download = useDownload()

    const index = download.downloadList.vodList.onGoing.findIndex(
      (i) => i.videoID === item.videoID
    )

    if (index === -1) return

    if (item.pid !== undefined) killProcess(item.pid)

    download.downloadList.vodList.onGoing[index].status = 'Cancelled'

    download.downloadList.vodList.error.push(
      Object.assign({}, download.downloadList.vodList.onGoing[index])
    )

    download.downloadList.vodList.onGoing.splice(index, 1)

    await download.setDownloadList()
  }

  static async deleteVodDownload(
    item: DownloadItem,
    from: 'queue' | 'error' | 'success'
  ) {
    const download = useDownload()

    const index = download.downloadList.vodList[from].findIndex(
      (i) => i.videoID === item.videoID
    )

    if (index === -1) return

    download.downloadList.vodList[from].splice(index, 1)

    await download.setDownloadList()
  }

  static clearLiveCheckTimer(user_id: string) {
    clearTimeout(Download.liveCheckTimer[user_id])

    delete Download.liveCheckTimer[user_id]
  }

  static clearLiveCheckTimers() {
    Object.keys(Download.liveCheckTimer).forEach(Download.clearLiveCheckTimer)
  }
}
