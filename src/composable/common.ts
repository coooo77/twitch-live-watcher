import {
  timeString,
  getExportJSONPath,
  getImportJSONPath
} from '../util/common'
import fs from 'fs'
import { useNotification } from '../store/notification'

export function handleJsonFile() {
  const notify = useNotification()

  const importJSON = async (callback: (importData: any) => Promise<void>) => {
    const jsonPath = await getImportJSONPath()

    if (!jsonPath) return

    try {
      const rawData = fs.readFileSync(jsonPath).toString()

      if (!rawData) throw Error('Invalid JSON file')

      const importData = JSON.parse(rawData)

      await callback(importData)

      notify.success('configuration imported successfully')
    } catch (error) {
      console.error(error)

      notify.warn('fail to import configuration')
    }
  }

  const exportJSON = async (exportData: any, defaultFilename: string, cmdTitle: string) => {
    try {
      const { pre, post } = timeString()

      const filename = `${defaultFilename}_${pre}_${post}`

      const jsonPath = await getExportJSONPath(filename, cmdTitle)

      if (!jsonPath) return

      fs.writeFileSync(jsonPath, JSON.stringify(exportData))

      notify.success('configuration exported successfully')
    } catch (error) {
      console.error(error)

      notify.warn('fail to export configuration')
    }
  }

  return { importJSON, exportJSON }
}
