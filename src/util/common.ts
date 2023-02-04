import cp from 'child_process'
import { ipcRenderer, shell } from 'electron'

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

  const pre = [year, month, day].map((i) => String(i).padStart(2, '0')).join('')

  const post = [hour, minute, second]
    .map((i) => String(i).padStart(2, '0'))
    .join('')

  return { pre, post }
}

export function wait(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export function isProcessRunning(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function killProcess(pid?: number, signal: string | number = 'SIGTERM') {
  if (typeof pid === 'undefined') return

  if (!isProcessRunning(pid)) return

  if (process.platform == 'win32') {
    cp.exec(`taskkill /PID ${pid} /T /F`)
  } else {
    process.kill(-pid, signal)
  }
}

export function openUrl(url: string) {
  shell.openExternal(url)
}
