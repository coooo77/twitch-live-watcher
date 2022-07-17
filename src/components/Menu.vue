<template>
  <div class="menu generalShadow bg-themeColor1 rounded-xl border border-themeColor3">
    <div
      :class="[isExpand ? ' md:w-[180px]' : 'md:w-[60px]']"
      class="grid grid-cols-6 gap-1 p-2 h-full transition-all md:flex md:flex-col md:gap-4"
    >
      <div class="option hidden md:block" @click="toggle">
        <Icon
          class="text-themeColor4 transition-transform min-w-[30px]"
          :class="{ 'rotate-180': isExpand }"
          icon="fe:arrow-right"
          :width="iconSize"
          :height="iconSize"
        />
      </div>

      <!-- prettier-ignore -->
      <div
        v-for="item of routes"
        :key="item.name"
        class="option"
        :class="{'option-active': route.name == item.name }"
        @click="goToPage(item.name)"
      >
        <Icon
          class="text-themeColor4 min-w-[30px]"
          :icon="item.meta?.menuIcon"
          :width="iconSize"
          :height="iconSize"
        />

        <div
          class="optionName text-themeColor4"
          :class="[`md:${isExpand ? 'max-w-auto' : 'max-w-0'}`]"
        >
          {{ item.meta?.menuBtnName }}
        </div>
      </div>

      <!-- prettier-ignore -->
      <div class="option md:mt-auto" @click="logout">
        <Icon
          class="text-themeColor4 min-w-[30px]"
          icon="ic:outline-logout"
          :width="iconSize"
          :height="iconSize"
        />
        
        <div
          class="optionName text-themeColor4"
          :class="[`md:${isExpand ? 'max-w-auto' : 'max-w-0'}`]"
        >
          Logout
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import routes from '../router/routes'
import { ipcRenderer } from 'electron'
import { RouteRecordName } from 'vue-router'

const iconSize = 30

const route = useRoute()

const router = useRouter()

const isExpand = ref(true)

const goToPage = (name?: RouteRecordName) => router.push({ name })

const logout = () => ipcRenderer.send('logout')

const toggle = () => {
  isExpand.value = !isExpand.value
}
</script>

<style type="scss">
.option {
  @apply cursor-pointer py-2 rounded-[8px] flex flex-col items-center md:flex-row md:px-2;
}

.optionName {
  @apply select-none font-bold flex justify-center grow transition-all overflow-hidden;
}

.option-active {
  @apply bg-themeColor2;
  box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.25);
}
</style>
