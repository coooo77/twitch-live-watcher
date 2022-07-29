export function getUrlAndPublish(url: string, publish: string) {
  const imgUrl = computed(() => {
    return url.replace('%{width}', '320').replace('%{height}', '180')
  })

  const displayTime = computed(() => {
    const time = new Date(publish)

    const year = time.getFullYear()

    const month = String(time.getMonth() + 1).padStart(2, '0')

    const day = String(time.getDay()).padStart(2, '0')

    const hour = String(time.getHours()).padStart(2, '0')

    const minute = String(time.getMinutes()).padStart(2, '0')

    const second = String(time.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  })

  return {
    imgUrl,
    displayTime
  }
}
