import os from 'os'
import keytar from 'keytar'
import { session } from 'electron'
import axios, { AxiosRequestConfig } from 'axios'

export default class AuthService {
  private static state = Math.random().toString(36).substring(2, 15)

  private static readonly keytarAccount = os.userInfo().username

  private static readonly userIDService = 'userID'

  private static readonly accessService = 'accessToken'

  private static readonly refreshService = 'refreshToken'

  public static accessToken = ''

  public static userName = ''

  public static userID = ''

  public static authenticationURL() {
    return (
      `${process.env['VITE_BASE_URL']}/authorize?` +
      `redirect_uri=${process.env['VITE_REDIRECT_URL']}` +
      '&' +
      `client_id=${process.env['VITE_CLIENT_ID']}` +
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
    const refreshToken = await keytar.getPassword(AuthService.refreshService, AuthService.keytarAccount)

    if (!refreshToken) throw new Error('No available refresh token.')

    try {
      const refreshOptions: AxiosRequestConfig = {
        method: 'POST',
        url: `${process.env['VITE_BASE_URL']}/token`,
        headers: { 'content-type': 'application/json' },
        data: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env['VITE_CLIENT_ID'],
          client_secret: process.env['VITE_CLIENT_SECRET']
        },
        adapter: require('axios/lib/adapters/http')
      }

      const response = await axios(refreshOptions)

      const { access_token, refresh_token } = response.data

      await Promise.allSettled([
        AuthService.setKeyChain(access_token, AuthService.accessService),
        AuthService.setKeyChain(refresh_token, AuthService.refreshService)
      ])

      AuthService.accessToken = access_token
    } catch (error) {
      await AuthService.logout()

      // TODO: ERROR LOG
      throw error
    }
  }

  public static async loadTokens(callbackURL: string) {
    const params = new URL(callbackURL)

    if (AuthService.state !== params.searchParams.get('state')) {
      throw new Error(`Invalid state in callbackURL`)
    }

    const exchangeOptions = {
      grant_type: 'authorization_code',
      code: params.searchParams.get('code'),
      client_id: process.env['VITE_CLIENT_ID'],
      redirect_uri: process.env['VITE_REDIRECT_URL'],
      client_secret: process.env['VITE_CLIENT_SECRET']
    }

    const options: AxiosRequestConfig = {
      method: 'POST',
      data: JSON.stringify(exchangeOptions),
      url: `${process.env['VITE_BASE_URL']}/token`,
      headers: { 'content-type': 'application/json' },
      adapter: require('axios/lib/adapters/http')
    }

    try {
      const response = await axios(options)

      const { access_token, refresh_token } = response.data

      await Promise.allSettled([
        AuthService.setKeyChain(access_token, AuthService.accessService),
        AuthService.setKeyChain(refresh_token, AuthService.refreshService)
      ])

      AuthService.accessToken = access_token
    } catch (error) {
      await AuthService.logout()

      // TODO: ERROR LOG
      throw error
    }
  }

  private static async setKeyChain(token: string, type: 'refreshToken' | 'accessToken' | 'userID') {
    if (!token) return

    await keytar.setPassword(type, AuthService.keytarAccount, token)
  }

  public static async logout() {
    // await AuthService.clearCookie()

    await Promise.allSettled([
      keytar.deletePassword(AuthService.accessService, AuthService.keytarAccount),
      keytar.deletePassword(AuthService.refreshService, AuthService.keytarAccount),
      keytar.deletePassword(AuthService.userIDService, AuthService.keytarAccount)
    ])

    AuthService.accessToken = ''

    AuthService.userID = ''

    AuthService.userName = ''
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
    if (!AuthService.accessToken) throw new Error('No access token for user information')

    const res = await axios({
      method: 'GET',
      url: 'https://id.twitch.tv/oauth2/userinfo',
      headers: { Authorization: `Bearer ${AuthService.accessToken}` },
      adapter: require('axios/lib/adapters/http')
    })

    AuthService.userID = res.data.sub

    AuthService.userName = res.data.preferred_username

    await AuthService.setKeyChain(AuthService.userID, AuthService.userIDService)
  }
}
