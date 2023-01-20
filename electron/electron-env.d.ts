/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true'
    DIST_ELECTRON: string
    DIST: string
    /** /dist/ or /public/ */
    PUBLIC: string
  }
}

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_HOST: string
  readonly VITE_DEV_SERVER_PORT: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_CLIENT_SECRET: string
  readonly VITE_REDIRECT_URL: string
  readonly VITE_BASE_URL: string
}

interface ImportMeta {
  /** shims Vite */
  env: Record<string, any>
}
