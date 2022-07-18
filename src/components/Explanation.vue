<template>
  <el-popover :content="content" placement="left" trigger="hover" :width="450">
    <template #reference>
      <Icon
        class="text-themeColor4"
        icon="ant-design:question-circle-filled"
        :width="iconSize"
        :height="iconSize"
      />
    </template>

    <slot name="popContent" />
  </el-popover>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { withDefaults } from 'vue'

const iconSize = 20

withDefaults(
  defineProps<{
    content?: string
  }>(),
  {
    content: 'Unknown Content'
  }
)
</script>
