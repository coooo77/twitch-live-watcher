import { RecordSetting } from "./streamer"

export interface GeneralSetting {
  /** interval for online check (unit: seconds) */
  checkStreamInterval: number
  /** directory path where files save */
  dirToSaveRecord: string
  /** numbers of recorder allow to run, set 0 as unlimited */
  numOfDownloadLimit: number
  /** show download cmd */
  showDownloadCmd: boolean
  /** close cmd when app stop */
  closeCmdWhenAppStop: boolean
  /** automatically execute on program startup. */
  autoExecuteOnStartup: boolean
}

export interface VodSetting {
  /** minutes to download VOD again when VOD download is failed  */
  reTryDownloadInterval: number
  /** maximum times to download VOD */
  maxReDownloadTimes: number
  /** acceptable amount of loss duration (unit: seconds) */
  LossOfVODDurationAllowed: number
  /** check duration while VOD downloaded */
  IntegrityCheck: boolean
}

export interface Config {
  vod: VodSetting
  record: RecordSetting
  general: GeneralSetting
}
