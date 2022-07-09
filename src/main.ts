import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
// import './samples/node-api'

createApp(App)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
