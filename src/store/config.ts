import { defineStore } from 'pinia'
import FileSystem from '../util/file'
import ModelSystem from '../util/model'
import { Config } from '../types/config'
import ConfigSystem from '../util/config'

export default defineStore('config', {
  state: () => {
    return { userConfig: ConfigSystem.defaultSetting }
  },
  actions: {
    async getConfig() {
      try {
        this.userConfig = await ModelSystem.getConfig()
      } catch (error) {
        FileSystem.errorHandler(error)
      } finally {
        return this.userConfig
      }
    },
    async setConfig(config: Config) {
      try {
        if (!config) {
          await ModelSystem.setConfig(this.userConfig)
        } else {
          await ModelSystem.setConfig(config)

          this.userConfig = config
        }

        return true
      } catch (error) {
        FileSystem.errorHandler(error)

        return false
      }
    }
  }
})
