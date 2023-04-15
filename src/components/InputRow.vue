<template>
  <div
    class="inputRow grid grid-rows-2 grid-cols-[1fr,min-content] items-center gap-y-1 gap-x-2"
  >
    <div
      class="inputTitle flex items-center gap-2 font-bold text-themeColor4 col-span-2"
    >
      <div class="h-2 w-2 bg-themeColor4 transform rotate-45 ml-1" />
      {{ title }}
    </div>

    <slot />

    <slot name="popIcon" />
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'

withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'Unknown Title'
  }
)
</script>
