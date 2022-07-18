<template>
  <div class="inputRow grid grid-cols-[150px,1fr,min-content] items-center gap-2">
    <div class="inputTitle text-right font-bold text-themeColor4">
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
