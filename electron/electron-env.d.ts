
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production'
    readonly VITE_DEV_SERVER_HOST: string
    readonly VITE_DEV_SERVER_PORT: string
    readonly VITE_CLIENT_ID: string
    readonly VITE_CLIENT_SECRET: string
    readonly VITE_REDIRECT_URL: string
    readonly VITE_BASE_URL: string
  }
}
