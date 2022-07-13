import MainProcess from './mainProcess'
import AuthService from './util/authService'
import { BrowserWindow, WebRequestFilter } from 'electron'

export default class AuthProcess {
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

    const {
      session: { webRequest }
    } = AuthProcess.authWindow.webContents

    const filter: WebRequestFilter = {
      urls: [`${process.env['VITE_REDIRECT_URL']}*`]
    }

    webRequest.onBeforeRequest(filter, AuthProcess.handleRequest.bind(AuthProcess))

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
      logoutWindow.close()

      await AuthService.logout()
    })
  }
}
