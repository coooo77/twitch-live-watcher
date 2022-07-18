import { join } from 'path'
import FilesSystem from './file'
import ConfigSystem from './config'
import AuthService from './authService'
import { Config } from 'src/types/config'

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
    const configPath = await ModelSystem.getTargetFilePath(ConfigSystem.filename)

    return FilesSystem.getOrCreateFile(configPath, ConfigSystem.defaultSetting)
  }

  static async setConfig(config?: Config) {
    if (!config) return
    
    const configPath = await ModelSystem.getTargetFilePath(ConfigSystem.filename)

    FilesSystem.saveFile(configPath, config)
  }
}