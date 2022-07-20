import { ipcRenderer } from 'electron'

export async function getDirPath() {
  const res = (await ipcRenderer.invoke('showOpenDialog', {
    properties: ['openDirectory']
  })) as string[] | undefined

  return res?.[0] || ''
}

export async function getImportJSONPath() {
  const importPath = (await ipcRenderer.invoke('showOpenDialog', {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })) as string[] | undefined

  return importPath?.[0] || ''
}

export async function getExportJSONPath(exportFileName: string, title: string) {
  const exportPath = (await ipcRenderer.invoke('showSaveDialog', {
    title,
    defaultPath: exportFileName,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })) as string | undefined

  return exportPath || ''
}

export function timeString() {
  const timeNow = new Date()

  const year = timeNow.getFullYear()

  const month = timeNow.getMonth() + 1

  const day = timeNow.getDate()

  const hour = timeNow.getHours()

  const minute = timeNow.getMinutes()

  const second = timeNow.getMinutes()

  const pre = [year, month, day]
    .map((i) => String(i).padStart(2, '0'))
    .join('')

  const post = [hour, minute, second]
    .map((i) => String(i).padStart(2, '0'))
    .join('')
    
  return { pre, post }
}
