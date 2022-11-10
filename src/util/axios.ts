import FileSystem from './file'
import AuthService from './authService'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'

interface RequestConfig extends AxiosRequestConfig {
  _retry: boolean
}

const api = axios.create({
  timeout: 5000,
  headers: {
    'Client-Id': import.meta.env.VITE_CLIENT_ID
  }
})

api.interceptors.request.use(
  async (config) => {
    // prettier-ignore
    config.headers = Object.assign(
      config.headers || {},
      { Authorization: `Bearer ${AuthService.accessToken}` }
    )

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfig

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      await AuthService.refreshTokens()

      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${AuthService.accessToken}`

      return api(originalRequest)
    } else if (
      error.code === 'ECONNABORTED' ||
      error.response?.status !== 401
    ) {
      FileSystem.errorHandler(error)
    }

    return Promise.reject(error)
  }
)

export default api
