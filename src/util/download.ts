import fs from 'fs'
import path from 'path'
import Helper from './helper'
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

  static async recordLiveStream(stream: FollowedStream, retry = 0) {
    try {
      const follow = useFollow()
      const config = useConfig()

      const {
        general: { dirToSaveRecord, showDownloadCmd }
      } = config.userConfig
      const { user_login, recordSetting } =
        follow.followList.streamers[stream.user_id]

      const filename = Download.getStreamFilename(
        recordSetting.fileNameTemplate,
        stream
      )
      const filePath = path.join(dirToSaveRecord, `${filename}.ts`)
      const sourceUrl = `https://www.twitch.tv/${user_login}`

      const cmd = Download.getDownloadCmd(sourceUrl, filePath)

      let task: null | cp.ChildProcess = cp.spawn(cmd, [], {
        detached: showDownloadCmd,
        shell: true
      })

      const spawnFn = async () => {
        await Promise.all([
          Download.addDownloadRecord(stream, task?.pid),
          Download.updateStreamerStatus(stream, true)
        ])
      }

      // FIXME: Unknown reason stopping download live stream、stream end causes cmd spawn error
      const closeFn = async (code: number | null) => {
        task?.off('spawn', spawnFn)

        task?.off('close', closeFn)

        task = null

        const follow = useFollow()

        const isOffline = !follow.followList.onlineList[stream.user_id]

        if (isOffline || fs.existsSync(filePath) || code === 0) {
          await Promise.all([
            Download.removeDownloadRecord(stream),
            Download.updateStreamerStatus(stream, false)
          ])
        } else if (retry === 5) {
          const payload = {
            stream,
            message: 'reach max retry limit'
          }

          throw Error(JSON.stringify(payload))
        } else {
          await Helper.wait(60)

          await Download.abortLiveRecord(stream)

          await Download.recordLiveStream(stream, ++retry)
        }
      }

      task.on('spawn', spawnFn)

      task.on('close', closeFn)
    } catch (error) {
      FileSystem.errorHandler(error)

      throw error
    }
  }

  static getDownloadCmd(sourceUrl: string, filePath: string, isLive = true) {
    const { dir } = path.parse(filePath)
    FileSystem.makeDirIfNotExist(dir)

    const liveSetting = isLive ? `--twitch-disable-hosting ` : ''
    return `streamlink ${liveSetting}${sourceUrl} best -o ${filePath}`
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

    const {
      general: { dirToSaveRecord, showDownloadCmd }
    } = userConfig

    const baseDir = item.dirToSaveRecord || dirToSaveRecord

    const filePath = path.join(baseDir, `${item.filename}.ts`)

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    const cmd = Download.getDownloadCmd(item.url, filePath, false)

    let task: null | cp.ChildProcess = cp.spawn(cmd, [], {
      detached: showDownloadCmd,
      shell: true
    })

    const spawnFn = async () => {
      await Download.updateOngoing(item, task?.pid)
    }

    const closeFn = async (code: number | null) =>  {
      task?.off('spawn', spawnFn)

      task?.off('close', closeFn)

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
    }
    
    task.on('spawn', spawnFn)

    task.on('close', closeFn)
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
}
