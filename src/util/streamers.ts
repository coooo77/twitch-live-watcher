import { FollowList, RecordSetting, Streamer } from '../types/streamer'

export default class StreamerSystem {
  static filename = 'followList'

  static defaultFollowList: FollowList = {
    streamers: {},
    onlineList: {}
  }

  static defaultRecordSetting: RecordSetting = {
    enableRecord: true,
    enableNotify: true,
    vodEnableRecordVOD: true,
    vodIsStopRecordStream: true,
    vodGetStreamIfNoVod: true,
    vodMode: 'queue',
    vodCountDownInMinutes: 30,
    vodTimeZone: new Date(2022, 1, 10, 3, 0).toISOString(),
    vodFileNameTemplate: '{channel}_TwitchVOD_{date}_{duration}',
    checkStreamContentTypeEnable: true,
    checkStreamContentTypeTargetGameNames: 'Art;Just Chatting;',
    fileNameTemplate: '{channel}_TwitchLive_{date}',
    abortInvalidRecord: true
  }

  static defaultStreamerSetting: Omit<Streamer, 'recordSetting'> = {
    user_login: '',
    user_id: '',
    displayName: '',
    profileImg: '',
    offlineImg: '',
    status: {}
  }

  static defaultStreamer: Streamer = {
    ...StreamerSystem.defaultStreamerSetting,
    recordSetting: StreamerSystem.defaultRecordSetting
  }
}
