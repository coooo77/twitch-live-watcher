<template>
  <nav class="flex flex-nowrap justify-end gap-[0.5px] pt-[4px] px-[4px] drag">
    <!-- prettier-ignore -->
    <Icon
      class="hover:bg-themeColor4 hover:text-themeColor1 text-themeColor4 no-drag"
      v-for="button of buttons"
      :index="button.action"
      :icon="button.icon"
      :width="iconSize"
      :height="iconSize"
      @click="clickNavBtn(button.action)"
    />
  </nav>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ipcRenderer } from 'electron'

const iconSize = 20

const buttons = [
  {
    icon: 'clarity:window-min-line',
    action: 'mini'
  },
  {
    icon: 'clarity:window-restore-line',
    action: 'restore'
  },
  {
    icon: 'clarity:window-close-line',
    action: 'close'
  }
] as const

const clickNavBtn = (action: 'mini' | 'restore' | 'close') => ipcRenderer.send('navbar', action)

</script>
