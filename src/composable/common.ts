import {
  timeString,
  getExportJSONPath,
  getImportJSONPath
} from '../util/common'
import fs from 'fs'
import { ElMessage } from 'element-plus'

export function handleJsonFile() {
  const importJSON = async (callback: (importData: any) => Promise<void>) => {
    const jsonPath = await getImportJSONPath()

    if (!jsonPath) return

    try {
      const rawData = fs.readFileSync(jsonPath).toString()

      if (!rawData) throw Error('Invalid JSON file')

      const importData = JSON.parse(rawData)

      await callback(importData)

      ElMessage({
        message: 'configuration imported successfully',
        type: 'success'
      })
    } catch (error) {
      console.error(error)

      ElMessage({
        message: 'fail to import configuration',
        type: 'error'
      })
    }
  }

  const exportJSON = async (
    exportData: any,
    defaultFilename: string,
    cmdTitle: string
  ) => {
    try {
      const { pre, post } = timeString()

      const filename = `${defaultFilename}_${pre}_${post}`

      const jsonPath = await getExportJSONPath(filename, cmdTitle)

      if (!jsonPath) return

      fs.writeFileSync(jsonPath, JSON.stringify(exportData))

      ElMessage({
        message: 'configuration exported successfully',
        type: 'success'
      })
    } catch (error) {
      console.error(error)

      ElMessage({
        message: 'fail to export configuration',
        type: 'error'
      })
    }
  }

  return { importJSON, exportJSON }
}
