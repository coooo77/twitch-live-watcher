import os from 'os'
import { getPassword, setPassword } from 'keytar'
import axios, { AxiosRequestConfig } from 'axios'

export default class AuthService {
  private static readonly keytarAccount = os.userInfo().username

  private static readonly userIDService = 'userID'

  private static readonly accessService = 'accessToken'

  private static readonly refreshService = 'refreshToken'

  public static accessToken = ''

  public static userName = ''

  public static userID = ''

  public static async getAccessToken() {
    if (!AuthService.accessToken) {
      const { accessService, keytarAccount } = AuthService

      AuthService.accessToken = (await getPassword(accessService, keytarAccount)) || ''
    }

    return AuthService.accessToken
  }

  public static async getUserID() {
    if (!AuthService.userID) {
      await AuthService.getUserInfo()
    }

    return AuthService.userID
  }

  public static async refreshTokens() {
    const { accessService, refreshService, keytarAccount } = AuthService

    const refreshToken = await getPassword(refreshService, keytarAccount)

    if (!refreshToken) throw new Error('No available refresh token.')

    try {
      const refreshOptions: AxiosRequestConfig = {
        method: 'POST',
        url: `${import.meta.env.VITE_BASE_URL}/token`,
        headers: { 'content-type': 'application/json' },
        data: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: import.meta.env.VITE_CLIENT_ID,
          client_secret: import.meta.env.VITE_CLIENT_SECRET
        }
      }

      const response = await axios(refreshOptions)

      const { access_token, refresh_token } = response.data

      await Promise.allSettled([
        setPassword(accessService, keytarAccount, access_token),
        setPassword(refreshService, keytarAccount, refresh_token)
      ])

      AuthService.accessToken = access_token
    } catch (error) {
      // TODO: Logout user

      // TODO: ERROR LOG
      throw error
    }
  }

  public static async getUserInfo() {
    const accessToken = await AuthService.getAccessToken()

    const { userIDService, keytarAccount } = AuthService

    const res = await axios({
      method: 'GET',
      url: 'https://id.twitch.tv/oauth2/userinfo',
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    AuthService.userID = res.data.sub

    AuthService.userName = res.data.preferred_username

    await setPassword(userIDService, keytarAccount, res.data.sub)
  }
}
