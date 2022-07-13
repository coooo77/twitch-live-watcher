import { join } from 'path'
import { release, homedir } from 'os'
import { existsSync, readdirSync } from 'fs'
import { app, BrowserWindow, shell, ipcMain, session } from 'electron'

export default class Main {
  static ROOT_PATH = {
    // /dist
    dist: join(__dirname, '../..'),
    // /dist or /public
    public: join(__dirname, app.isPackaged ? '../..' : '../../../public')
  }

  static electronWindow: BrowserWindow | null = null

  // Here, you can also use other preload
  static preload = join(__dirname, '../preload/index.js')

  // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
  static url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`

  static indexHtml = join(Main.ROOT_PATH.dist, 'index.html')

  static beforeInit() {
    // Disable GPU Acceleration for Windows 7
    if (release().startsWith('6.1')) {
      app.disableHardwareAcceleration()
    }

    // Set application name for Windows 10+ notifications
    if (process.platform === 'win32') {
      app.setAppUserModelId(app.getName())
    }

    if (!app.requestSingleInstanceLock()) {
      app.quit()
      process.exit(0)
    }

    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
  }

  static async loadDevTools() {
    let devToolsPath = ''

    if (app.isPackaged) {
      devToolsPath = join(
        homedir(),
        '/AppData/Local/Google/Chrome/User Data/Default/Extensions/ljjemllljcmogpfapbkkighbhhppjdbg/6.0.0.21_0'
      )
    } else {
      const extensionDir = join(process.cwd(), './extensions/vue-dev-tools')

      devToolsPath = join(extensionDir, readdirSync(extensionDir)[0])
    }

    if (!existsSync(devToolsPath)) return

    await session.defaultSession.loadExtension(devToolsPath)
  }

  static async createWindow() {
    Main.loadDevTools()

    Main.electronWindow = new BrowserWindow({
      title: 'Main window',
      icon: join(Main.ROOT_PATH.public, 'favicon.ico'),
      frame: false,
      transparent: true,
      hasShadow: false,
      webPreferences: {
        preload: Main.preload,
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (app.isPackaged) {
      Main.electronWindow.loadFile(Main.indexHtml)
    } else {
      Main.electronWindow.loadURL(Main.url)

      // Main.electronWindow.webContents.openDevTools()
    }

    // Test actively push message to the Electron-Renderer
    Main.electronWindow.webContents.on('did-finish-load', () => {
      Main.electronWindow?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    Main.electronWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  static listenApp() {
    app.on('window-all-closed', () => {
      Main.electronWindow = null

      if (process.platform !== 'darwin') app.quit()
    })

    app.on('second-instance', () => {
      if (!Main.electronWindow) return

      // Focus on the main window if the user tried to open another
      if (Main.electronWindow.isMinimized()) Main.electronWindow.restore()

      Main.electronWindow.focus()
    })

    app.on('activate', () => {
      const allWindows = BrowserWindow.getAllWindows()
      if (allWindows.length) {
        allWindows[0].focus()
      } else {
        Main.createWindow()
      }
    })

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
      app.quit()
    })
  }

  static listenIpcMain() {
    // new window example arg: new windows url
    ipcMain.handle('open-win', (event, arg) => {
      const childWindow = new BrowserWindow({
        webPreferences: {
          preload: Main.preload
        }
      })

      if (app.isPackaged) {
        childWindow.loadFile(Main.indexHtml, { hash: arg })
      } else {
        childWindow.loadURL(`${Main.url}/#${arg}`)

        // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
      }
    })

    ipcMain.on('navbar', (event, val: 'mini' | 'restore' | 'close') => {
      const window: Electron.BrowserWindow | null = BrowserWindow.fromWebContents(event.sender)

      switch (val) {
        case 'mini':
          window?.minimize()
          break
        case 'close':
          window?.close()
          break
        case 'restore':
          if (window?.isMaximized()) {
            window?.unmaximize()
            window?.setResizable(true)
          } else {
            window?.maximize()
            window?.setResizable(false)
          }
          break
        default:
          break
      }
    })
  }

  static init() {
    Main.beforeInit()

    app.whenReady().then(Main.createWindow)

    Main.listenApp()

    Main.listenIpcMain()
  }
}
