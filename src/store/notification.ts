import { defineStore } from 'pinia'

const defaultTimeout = 3000

// 目前已棄用，使用Quasar的notify plugin取代
export const useNotification = defineStore('notification', {
  state: () => {
    return {
      message: '',
      isWarnType: false,
      timeout: defaultTimeout
    }
  },
  actions: {
    send(msg: string, isSuccess = true, timeout = defaultTimeout) {
      this.message = msg

      this.timeout = timeout

      this.isWarnType = !isSuccess

      setTimeout(() => {
        this.$reset()
      }, this.timeout)
    },
    warn(msg: string, timeout = defaultTimeout) {
      this.send(msg, false, timeout)
    },
    success(msg: string, timeout = defaultTimeout) {
      this.send(msg, true, timeout)
    }
  }
  // other options...
})
