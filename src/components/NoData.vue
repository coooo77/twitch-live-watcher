<template>
  <div class="noData absolute inset-0 flex">
    <div class="box m-auto">
      <Icon
        class="text-themeColor4 mx-auto"
        icon="fluent:document-error-20-filled"
        :width="iconSize"
        :height="iconSize"
      />
      <div
        class="text p-4 rounded-lg font-bold text-xl text-themeColor4 w-fit"
      >
        NO DATA
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const iconSize = 80
</script>
