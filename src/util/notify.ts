import { ElNotification } from 'element-plus'

export default class Notify {
  static send(message: string, isSuccess: boolean) {
    ElNotification({
      type: isSuccess ? 'success' : 'error',
      title: isSuccess ? 'Success' : 'Fail',
      message
    })
  }

  static warn(message: string) {
    Notify.send(message, false)
  }

  static success(message: string) {
    Notify.send(message, true)
  }
}
