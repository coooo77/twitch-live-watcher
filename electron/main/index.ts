import dotenv from 'dotenv'
import { app } from 'electron'
import MainProcess from './mainProcess'
import AuthProcess from './authProcess'
import AuthService from './util/authService'

dotenv.config()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  try {
    await AuthService.refreshTokens()

    await AuthService.getUserInfo()

    MainProcess.init()

    // TODO: Logout handler
  } catch (error) {
    AuthProcess.createAuthWindow()
  }
})
