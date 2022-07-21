<template>
  <div class="divider grid grid-cols-[1fr,min-content,1fr] gap-2 items-center">
    <div class="dividerLine h-1 w-full bg-themeColor4" />

    <div class="text whitespace-nowrap font-bold text-themeColor4 text-lg">{{ title }}</div>

    <div class="dividerLine h-1 w-full bg-themeColor4" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
