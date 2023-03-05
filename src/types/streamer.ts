import { DateStringType, StringTypeNumber } from './commonTypes'

// prettier-ignore
export type VODRecordMode = 
  | 'queue'
  | 'timeZone'
  | 'countDown'

export interface RecordSetting {
  /** enable record stream or vod */
  enableRecord: boolean
  /** enable online notify */
  enableNotify: boolean
  /** enable record vod */
  vodEnableRecordVOD: boolean
  /** disable record stream while vod is available */
  vodIsStopRecordStream: boolean
  /** enable record stream while vod is not available */
  vodGetStreamIfNoVod: boolean
  /** queue、manual、offLine、timeZone、countDown */
  vodMode: VODRecordMode
  /** setting for record mode - countDown */
  vodCountDownInMinutes: number
  /** [hour, minute, second] */
  vodTimeZone: DateStringType
  /** e.g. {channel}-TwitchVOD-{date}-{duration} */
  vodFileNameTemplate: string
  /** record stream for explicit game names only */
  checkStreamContentTypeEnable: boolean
  /** e.g. Art;Just Chatting; */
  checkStreamContentTypeTargetGameNames: string
  /** e.g. {channel}-TwitchLive-{date} */
  fileNameTemplate: string
  /** abort recording stream when streamers change their stream content type */
  abortInvalidRecord: boolean
}

export interface UserStatus {
  streamStartedAt?: string
}

export interface StreamerStatus {
  isRecording: boolean
  onlineVodID?: string
  isForbidden?: boolean
  reTryTimes?: number
  isReachReTryLimit?: boolean
}

export interface Streamer {
  /** twitch user login account */
  user_login: string
  user_id: StringTypeNumber
  displayName: string
  profileImg: string
  offlineImg: string
  status: UserStatus
  recordSetting: RecordSetting
}

export type Streamers = Record<Streamer['user_id'], Streamer>

export type OnlineInfo = Pick<Streamer, 'user_login' | 'displayName'> &
  StreamerStatus

export type OnlineList = Record<Streamer['user_id'], OnlineInfo>

export interface FollowList {
  streamers: Streamers
  onlineList: OnlineList
}
