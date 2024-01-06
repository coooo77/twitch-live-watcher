import {
  app,
  shell,
  dialog,
  ipcMain,
  session,
  Notification,
  BrowserWindow,
  WebRequestFilter,
  OpenDialogSyncOptions,
  SaveDialogSyncOptions
} from 'electron'
import keytar from 'keytar'
import { join } from 'path'
import fetch from 'node-fetch'
import type Electron from 'electron'
import { release, homedir, userInfo } from 'os'
import { existsSync, readdirSync, writeFileSync, readFileSync } from 'fs'

interface debugLoggerData {
  message: string
  date: string
}

process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

const modelPath = join(__dirname, '../../../model')

class MainProcess {
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
  static url = import.meta.env['VITE_DEV_SERVER_URL']

  static indexHtml = join(process.env.DIST, 'index.html')

  static isDevToolOpen = false

  static openDevTool() {
    if (!MainProcess.electronWindow) return

    if (MainProcess.isDevToolOpen) {
      MainProcess.electronWindow.webContents.closeDevTools()
    } else {
      MainProcess.electronWindow.webContents.openDevTools()
    }

    MainProcess.isDevToolOpen = !MainProcess.isDevToolOpen
  }

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
    MainProcess.loadDevTools()

    MainProcess.electronWindow = new BrowserWindow({
      title: 'Main window',
      icon: join(MainProcess.ROOT_PATH.public, 'favicon.ico'),
      frame: false,
      transparent: true,
      hasShadow: false,
      minWidth: 375,
      minHeight: 667,
      webPreferences: {
        preload: MainProcess.preload,
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (app.isPackaged) {
      MainProcess.electronWindow.loadFile(MainProcess.indexHtml)

      // MainProcess.openDevTool()
    } else {
      MainProcess.electronWindow.loadURL(MainProcess.url)

      MainProcess.openDevTool()
    }

    // Test actively push message to the Electron-Renderer
    MainProcess.electronWindow.webContents.on('did-finish-load', () => {
      MainProcess.electronWindow?.webContents.send(
        'main-process-message',
        new Date().toLocaleString()
      )
    })

    // Make all links open with the browser, not with the application
    MainProcess.electronWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    MainProcess.listenElectronWindow(MainProcess.electronWindow)
  }

  static listenApp() {
    app.on('window-all-closed', () => {
      MainProcess.electronWindow = null

      if (process.platform !== 'darwin') app.quit()
    })

    app.on('second-instance', () => {
      if (!MainProcess.electronWindow) return

      // Focus on the main window if the user tried to open another
      if (MainProcess.electronWindow.isMinimized())
        MainProcess.electronWindow.restore()

      MainProcess.electronWindow.focus()
    })

    app.on('activate', () => {
      const allWindows = BrowserWindow.getAllWindows()
      if (allWindows.length) {
        allWindows[0].focus()
      } else {
        MainProcess.createWindow()
      }
    })
  }

  static listenIpcMain() {
    const onEvent = ['navbar', 'logout', 'notify:online']

    onEvent.forEach((event) => ipcMain?.off(event, () => {}))

    const handleEvent = ['open-win', 'showOpenDialog', 'showSaveDialog']

    handleEvent.forEach((event) => ipcMain?.removeHandler(event))

    // new window example arg: new windows url
    ipcMain.handle('open-win', (event, arg) => {
      const childWindow = new BrowserWindow({
        webPreferences: {
          preload: MainProcess.preload
        }
      })

      if (app.isPackaged) {
        childWindow.loadFile(MainProcess.indexHtml, { hash: arg })
      } else {
        childWindow.loadURL(`${MainProcess.url}/#${arg}`)

        // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
      }
    })

    ipcMain.handle('getAccessToken', () => AuthService.accessToken)

    ipcMain.handle('getUserID', () => AuthService.userID)

    ipcMain.handle('refreshTokens', async () => {
      await AuthService.refreshTokens()

      return AuthService.accessToken
    })

    ipcMain.handle('showOpenDialog', (event, args: OpenDialogSyncOptions) =>
      dialog.showOpenDialogSync(args)
    )

    ipcMain.handle('showSaveDialog', (event, args: SaveDialogSyncOptions) =>
      dialog.showSaveDialogSync(args)
    )

    ipcMain.on('navbar', (event, val: 'mini' | 'restore' | 'close') => {
      const window: Electron.BrowserWindow | null =
        BrowserWindow.fromWebContents(event.sender)

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

    ipcMain.on('logout', async (event, args) => {
      await AuthService.logout()

      MainProcess.destroyAppWin()

      AuthProcess.createAuthWindow()
    })

    ipcMain.on('notify:online', (event, args) => {
      const window: Electron.BrowserWindow | null =
        BrowserWindow.fromWebContents(event.sender)

      const notify = new Notification({
        title: `${args.streamer} is online now!`,
        body: args.timeAt
      })

      notify.on('click', () => window?.show())

      notify.show()
    })

    ipcMain.on('open:devTool', async (event, args) => {
      MainProcess.openDevTool()
    })

    ipcMain.on('setAutoExeOnComputerStartup', (event, val: boolean) => {
      app.setLoginItemSettings({
        openAtLogin: val
      })
    })

    ipcMain.on('getAppDataPath', (event) => {
      event.returnValue = app.getPath('userData')
    })
  }

  static listenElectronWindow(browserWindow: BrowserWindow) {
    // Test actively push message to the Electron-Renderer
    browserWindow.webContents.on('did-finish-load', () => {
      const isModelFolderExist = existsSync(modelPath)

      const msg = `is Model Folder Exist ${isModelFolderExist} `

      browserWindow.webContents.send(
        'main-process-message',
        msg + new Date().toLocaleString()
      )
    })

    browserWindow.on('close', (event) => {
      // TODO: check if have to clear data before exit
      const choice = dialog.showMessageBoxSync(browserWindow, {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to quit?',
        defaultId: 0
      })

      if (choice === 1) event.preventDefault()
    })
  }

  static destroyAppWin() {
    if (!MainProcess.electronWindow) return

    MainProcess.electronWindow.close()

    MainProcess.electronWindow = null
  }

  static init() {
    MainProcess.beforeInit()

    app.whenReady().then(MainProcess.createWindow)

    MainProcess.listenApp()

    MainProcess.listenIpcMain()
  }
}

class AuthProcess {
  public static authWindow: null | BrowserWindow = null

  public static createAuthWindow() {
    AuthProcess.destroyAuthWin()

    AuthProcess.authWindow = new BrowserWindow({
      width: 480,
      height: 800,
      webPreferences: {
        nodeIntegration: false
      }
    })

    AuthProcess.authWindow.loadURL(AuthService.authenticationURL())

    // AuthProcess.authWindow.webContents.openDevTools()

    const {
      session: { webRequest }
    } = AuthProcess.authWindow.webContents

    const filter: WebRequestFilter = {
      urls: [`${import.meta.env['VITE_REDIRECT_URL']}*`]
    }

    webRequest.onBeforeRequest(
      filter,
      AuthProcess.handleRequest.bind(AuthProcess)
    )

    AuthProcess.authWindow.once('closed', () => (AuthProcess.authWindow = null))
  }

  private static async handleRequest(param: { url: string }) {
    await AuthService.loadTokens(param.url)

    await AuthService.getUserInfo()

    MainProcess.init()

    return AuthProcess.destroyAuthWin()
  }

  private static destroyAuthWin() {
    if (!AuthProcess.authWindow) return

    AuthProcess.authWindow.close()

    AuthProcess.authWindow = null
  }

  public static createLogoutWindow() {
    const logoutWindow = new BrowserWindow({
      show: false
    })

    logoutWindow.on('ready-to-show', async () => {
      AuthService.writeLogger(`ready-to-show logout, remove refresh_token`)

      logoutWindow.close()

      await AuthService.logout()
    })
  }
}

class AuthService {
  private static state = Math.random().toString(36).substring(2, 15)

  private static readonly keytarAccount = userInfo().username

  private static readonly userIDService = 'userID'

  private static readonly accessService = 'accessToken'

  private static readonly refreshService = 'refreshToken'

  public static accessToken = ''

  public static userName = ''

  public static userID = ''

  private static readonly debugLoggerPath = join(
    app.getPath('userData'),
    'debugLogger.json'
  )

  public static authenticationURL() {
    return (
      `${import.meta.env['VITE_BASE_URL']}/authorize?` +
      `redirect_uri=${import.meta.env['VITE_REDIRECT_URL']}` +
      '&' +
      `client_id=${import.meta.env['VITE_CLIENT_ID']}` +
      '&' +
      'scope=user:read:follows' +
      '&' +
      'response_type=code' +
      '&' +
      'force_verify=true' +
      '&' +
      `state=${AuthService.state}`
    )
  }

  public static async refreshTokens() {
    const refreshToken = await keytar.getPassword(
      AuthService.refreshService,
      AuthService.keytarAccount
    )

    if (!refreshToken) throw new Error('No available refresh token.')

    try {
      const url = `${import.meta.env['VITE_BASE_URL']}/token`

      const options = {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: import.meta.env['VITE_CLIENT_ID'],
          client_secret: import.meta.env['VITE_CLIENT_SECRET']
        })
      }

      const response = await fetch(url, options)

      const data = await response.json()

      const { access_token, refresh_token } = data as any

      await Promise.allSettled([
        AuthService.setKeyChain(access_token, AuthService.accessService),
        AuthService.setKeyChain(refresh_token, AuthService.refreshService)
      ])

      AuthService.writeLogger(`refreshTokens, refresh_token: ${refresh_token}`)

      AuthService.accessToken = access_token
    } catch (error) {
      const e = error as { message: string }
      AuthService.writeLogger(
        `refreshTokens error, remove refresh_token, message: ${e?.message}`
      )

      if (!e?.message.includes('ENOTFOUND')) await AuthService.logout()

      // TODO: ERROR LOG
      throw error
    }
  }

  public static async loadTokens(callbackURL: string) {
    const params = new URL(callbackURL)

    if (AuthService.state !== params.searchParams.get('state')) {
      throw new Error(`Invalid state in callbackURL`)
    }

    try {
      const url = `${import.meta.env['VITE_BASE_URL']}/token`

      const options = {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: params.searchParams.get('code'),
          client_id: import.meta.env['VITE_CLIENT_ID'],
          redirect_uri: import.meta.env['VITE_REDIRECT_URL'],
          client_secret: import.meta.env['VITE_CLIENT_SECRET']
        })
      }

      const response = await fetch(url, options)

      const data = await response.json()

      const { access_token, refresh_token } = data as any

      await Promise.allSettled([
        AuthService.setKeyChain(access_token, AuthService.accessService),
        AuthService.setKeyChain(refresh_token, AuthService.refreshService)
      ])

      AuthService.writeLogger(`loadTokens, refresh_token: ${refresh_token}`)

      AuthService.accessToken = access_token
    } catch (error) {
      const e = error as { message: string }
      AuthService.writeLogger(
        `loadTokens error, remove refresh_token, message: ${e?.message}`
      )
      await AuthService.logout()

      // TODO: ERROR LOG
      throw error
    }
  }

  private static async setKeyChain(
    token: string,
    type: 'refreshToken' | 'accessToken' | 'userID'
  ) {
    if (!token) return

    await keytar.setPassword(type, AuthService.keytarAccount, token)
  }

  public static async logout() {
    // await AuthService.clearCookie()

    await Promise.allSettled([
      keytar.deletePassword(
        AuthService.accessService,
        AuthService.keytarAccount
      ),
      keytar.deletePassword(
        AuthService.refreshService,
        AuthService.keytarAccount
      ),
      keytar.deletePassword(
        AuthService.userIDService,
        AuthService.keytarAccount
      )
    ])

    AuthService.accessToken = ''

    AuthService.userID = ''

    AuthService.userName = ''

    AuthService.writeLogger(`logout, remove refresh_token`)
  }

  public static async clearCookie() {
    try {
      const cookies = await session.defaultSession.cookies.get({})

      for (let cookie of cookies) {
        let url = ''

        url += cookie.secure ? 'https://' : 'http://'

        url += cookie.domain?.charAt(0) === '.' ? 'www' : ''

        url += cookie.domain || ''

        url += cookie.path || ''

        await session.defaultSession.cookies.remove(url, cookie.name)
      }
    } catch (error) {
      // TODO: ERROR LOG
      console.error(`Clear cookie error: ${error}`)
    }
  }

  public static async getUserInfo() {
    if (!AuthService.accessToken)
      throw new Error('No access token for user information')

    const url = 'https://id.twitch.tv/oauth2/userinfo'

    const options = {
      method: 'get',
      headers: { Authorization: `Bearer ${AuthService.accessToken}` }
    }

    const response = await fetch(url, options)

    const data = (await response.json()) as any

    AuthService.userID = data.sub

    AuthService.userName = data.preferred_username

    await AuthService.setKeyChain(AuthService.userID, AuthService.userIDService)
  }

  private static getLoggerData(): debugLoggerData[] {
    const isLoggerExist = existsSync(AuthService.debugLoggerPath)

    if (!isLoggerExist) return []

    const loggerData = JSON.parse(
      readFileSync(AuthService.debugLoggerPath, { encoding: 'utf8' })
    )

    return loggerData
  }

  public static writeLogger(message: string) {
    const data = AuthService.getLoggerData()

    data.push({
      message,
      date: new Date().toLocaleString()
    })

    writeFileSync(AuthService.debugLoggerPath, JSON.stringify(data), 'utf8')
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  try {
    await AuthService.refreshTokens()

    await AuthService.getUserInfo()

    MainProcess.init()
  } catch (error) {
    AuthProcess.createAuthWindow()
  }
})
