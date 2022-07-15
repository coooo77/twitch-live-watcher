import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    menuIcon: string
    menuBtnName: string
    textSize?: number
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'live',
    meta: {
      title: 'Live List',
      menuIcon: 'ic:outline-live-tv',
      menuBtnName: 'Live'
    },
    component: () => import('../pages/Live.vue')
  },
  {
    path: '/follow',
    name: 'follow',
    meta: {
      title: 'Follow List',
      menuIcon: 'ph:users-three-fill',
      menuBtnName: 'Follow'
    },
    component: () => import('../pages/Follow.vue')
  },
  {
    path: '/download',
    name: 'download',
    meta: {
      title: 'Download List',
      menuIcon: 'fa6-solid:download',
      menuBtnName: 'Download'
    },
    component: () => import('../pages/Download.vue')
  },
  {
    path: '/search',
    name: 'search',
    meta: {
      title: 'Search VOD',
      menuIcon: 'fa-solid:search-plus',
      menuBtnName: 'Search'
    },
    component: () => import('../pages/Search.vue')
  },
  {
    path: '/config',
    name: 'config',
    meta: {
      title: 'Configuration',
      menuIcon: 'ant-design:setting-filled',
      menuBtnName: 'Config'
    },
    component: () => import('../pages/Config.vue')
  }
]

export default routes
