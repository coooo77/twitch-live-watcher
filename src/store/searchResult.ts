import { defineStore } from 'pinia'

/* types */
import { VideoSearched } from '../types/download'

export default defineStore('search-result', () => {
  const videosSearched = ref<VideoSearched[]>([])

  return {
    videosSearched
  }
})
