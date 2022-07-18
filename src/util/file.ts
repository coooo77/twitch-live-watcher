import fs from 'fs'
import path from 'path'

export default class FileSystem {
  static ROOT_PATH = process.env['ROOT_PATH'] || ''

  static errorLogPath = path.join(FileSystem.ROOT_PATH, './log')

  static makeDirIfNotExist(fileLocation: string) {
    if (fs.existsSync(fileLocation)) return

    fs.mkdirSync(fileLocation, { recursive: true })
  }

  static errorHandler(error: any) {
    const log = JSON.parse(JSON.stringify(error))

    log.date = new Date().toLocaleString()

    log.message = error.message || 'no error message'

    FileSystem.makeDirIfNotExist(FileSystem.errorLogPath)

    const filePath = path.join(FileSystem.errorLogPath, `${new Date().getTime()}.json`)

    fs.writeFileSync(filePath, JSON.stringify(log), 'utf8')
  }

  static saveFile(filePath: string, data: any) {
    try {
      const { dir } = path.parse(filePath)

      FileSystem.makeDirIfNotExist(dir)

      fs.writeFileSync(filePath, JSON.stringify(data), 'utf8')
    } catch (error) {
      FileSystem.errorHandler(error)
    }
  }

  static getFile(filePath: string) {
    try {
      const result = fs.readFileSync(`${filePath}`, 'utf8')

      return JSON.parse(result)
    } catch (error) {
      FileSystem.errorHandler(error)
    }
  }

  static getOrCreateFile<T>(filePath: string, defaultData: T): T {
    if (fs.existsSync(filePath)) {
      return FileSystem.getFile(filePath)
    }

    FileSystem.saveFile(filePath, defaultData)

    return defaultData
  }

  static getFullPath(dir: string, filename: string, ext = '.json') {
    return path.join(dir, filename + ext)
  }
}
