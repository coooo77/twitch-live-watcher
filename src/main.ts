import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import router from './router'
// import './samples/node-api'

createApp(App)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
