<template>
  <transition
    name="show"
    @after-enter="$emit('update:isShowDialogContent', true)"
  >
    <div
      v-show="isShowDialog"
      class="dialogWrapper fixed inset-0"
      :style="cssStyle"
    >
      <div
        aria-hidden="true"
        class="dialogBackDrop fixed inset-0"
        @click="$emit('update:isShowDialogContent', false)"
      />

      <transition
        name="scale"
        appear
        @after-leave="$emit('update:isShowDialog', false)"
      >
        <div
          v-show="isShowDialogContent"
          class="dialog fixed pointer-events-none inset-0 flex items-center justify-center px-6"
        >
          <slot />
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'

const props = withDefaults(
  defineProps<{
    isShowDialog: boolean
    isShowDialogContent: boolean
    dialogDuration?: number
    contentDuration?: number
  }>(),
  {
    dialogDuration: 0.3,
    contentDuration: 0.3
  }
)

const cssStyle = computed(() => {
  return {
    '--dialogDuration': `${props.dialogDuration}s`,
    '--contentDuration': `${props.contentDuration}s`
  }
})
</script>

<style lang="scss" scoped>
:deep(.dialog *:nth-child(1)) {
  pointer-events: all;
}

.dialogWrapper {
  z-index: 2000;
  max-width: 100vw;
  max-height: 100vw;
}

.dialogBackDrop {
  z-index: -1;
  background: rgba(0, 0, 0, 0.4);
}

.show-enter-active, .show-leave-active {
  transition: opacity var(--dialogDuration, .5s);
}

.show-enter, .show-leave-to {
  opacity: 0;
}

.scale-enter-active, .scale-leave-active {
  transition: transform var(--contentDuration, .5s) ease;
}

.scale-enter, .scale-leave-to {
  transform-origin: center;
  transform: scale(0);
}

</style>
