import { IVod } from '../api/user'
import { VODRecordMode } from './streamer'
import { DateStringType } from './commonTypes'

export type StreamID = string

export type DownloadStatus = 'Downloading' | 'Queue' | 'Cancelled' | 'Success'

export interface DownloadItem {
  pid?: number
  videoID: string
  duration: string
  createdTime: DateStringType
  /** able to download if less than current time */
  validDownloadTime: DateStringType
  mod: VODRecordMode
  retryTimes: number
  url: string
  filename: string
  user_login: string
  note?: string
  dirToSaveRecord?: string
  status: DownloadStatus
  thumbnail_url: string
  title: string
}

export interface VodDownload {
  queue: DownloadItem[]
  onGoing: DownloadItem[]
  success: DownloadItem[]
  error: DownloadItem[]
}

export interface LiveStream {
  pid?: number
  user_id: string
  user_login: string
  startAt: DateStringType
}

export interface LiveStreams {
  [key: StreamID]: LiveStream
}

export interface DownloadList {
  liveStreams: LiveStreams
  vodList: VodDownload
}

export interface VideoSearched {
  video: IVod
  downloadItem: DownloadItem
}
