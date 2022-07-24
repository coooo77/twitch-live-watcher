import { FollowList, RecordSetting, Streamer } from "src/types/streamer"

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
    fileNameTemplate: '{channel}_TwitchLive_{date}'
  }

  static defaultStreamerSetting: Omit<Streamer, 'recordSetting'> = {
    user_login: '',
    user_id: '',
    displayName: '',
    profileImg: '',
    offlineImg: '',
    status: {
      isOnline: false,
      isRecording: false
    }
  }

  static defaultStreamer: Streamer = {
    ...StreamerSystem.defaultStreamerSetting,
    recordSetting: StreamerSystem.defaultRecordSetting
  }
}