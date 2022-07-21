import { join } from 'path'
import FilesSystem from './file'
import ConfigSystem from './config'
import AuthService from './authService'
import StreamerSystem from './streamers'
import { Config } from 'src/types/config'
import { FollowList } from 'src/types/streamer'

export default class ModelSystem {
  private static async modelPath() {
    const userID = await AuthService.getUserID()

    return join(FilesSystem.ROOT_PATH, './model/', userID)
  }

  private static async getTargetFilePath(filename: string) {
    const modelPath = await ModelSystem.modelPath()

    return FilesSystem.getFullPath(modelPath, filename)
  }

  static async getConfig() {
    const configPath = await ModelSystem.getTargetFilePath(
      ConfigSystem.filename
    )

    return FilesSystem.getOrCreateFile(configPath, ConfigSystem.defaultSetting)
  }

  static async setConfig(config?: Config) {
    if (!config) return

    const configPath = await ModelSystem.getTargetFilePath(
      ConfigSystem.filename
    )

    FilesSystem.saveFile(configPath, config)
  }

  static async getFollowList() {
    const followListPath = await ModelSystem.getTargetFilePath(
      StreamerSystem.filename
    )

    return FilesSystem.getOrCreateFile(
      followListPath,
      StreamerSystem.defaultFollowList
    )
  }

  static async setFollowList(followList?: FollowList) {
    if (!followList) return

    const followListPath = await ModelSystem.getTargetFilePath(
      StreamerSystem.filename
    )

    FilesSystem.saveFile(followListPath, followList)
  }
}
