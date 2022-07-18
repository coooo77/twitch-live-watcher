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