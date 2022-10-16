<template>
  <transition>
    <div
      v-show="isShow"
      class="notification fixed inset-0 pointer-events-none flex items-center justify-center"
    >
      <div
        :class="[isWarnType ? 'bg-themeColor5 text-[white]' : 'bg-themeColor4 text-themeColor1']"
        class="info w-fit flex items-center justify-center positionCenter rounded-md font-bold shadow-shadow3 py-4 px-10"
      >
        {{ notify.message }}
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useNotification } from '../store/notification'

const notify = useNotification()

const isShow = computed(() => Boolean(notify.message))

const isWarnType = toRef(notify, 'isWarnType')
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
