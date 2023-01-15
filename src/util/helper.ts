export default {
  wait: (sec: number) => new Promise((res) => window.setTimeout(res, sec * 1000))
}
