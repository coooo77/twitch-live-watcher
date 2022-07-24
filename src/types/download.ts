import { DateStringType } from './commonTypes'
import { VODRecordMode } from './streamer'

export type StreamID = string

export type DownloadStatus = 'Downloading' | 'Queue' | 'Cancelled'

export interface DownloadItem {
  videoID: string
  createdTime: DateStringType
  finishTime?: DateStringType
  /** able to download if less than current time */
  validDownloadTime: DateStringType
  mod: VODRecordMode
  retryTimes: number
  duration: string
  url: string
  filename: string
  user_login: string
  note?: string
  status: DownloadStatus
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
