<template>
  <InputLayout
    v-model="_inputValue"
    :disabled="disableInput"
    :placeholder="placeholder"
    @enter="$emit('filter')"
  >
    <template #icon>
      <div class="icons flex item-center ml-auto">
        <Icon
          class="text-themeColor4 cursor-pointer"
          icon="material-symbols:filter-alt-outline-sharp"
          :width="iconSize"
          :height="iconSize"
          @click="$emit('filter')"
        />

        <Icon
          :class="[
            disableInput ? 'pointer-events-none cursor-wait' : 'cursor-pointer'
          ]"
          class="text-themeColor4 cursor-pointer"
          icon="ion:search"
          :width="iconSize"
          :height="iconSize"
          @click="$emit('add')"
        />
      </div>
    </template>
  </InputLayout>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'

import { Icon } from '@iconify/vue'

const iconSize = 25

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disableInput?: boolean
  }>(),
  {
    placeholder: '',
    disableInput: false
  }
)

const emit = defineEmits<{
  (eventName: 'add'): void
  (eventName: 'filter'): void
  (eventName: 'update:modelValue', value: string): void
}>()

const _inputValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value as string)
  }
})
</script>

<style scoped>
::placeholder {
  /* Chrome, Firefox, Opera, Safari 10.1+ */
  font-size: 16px;
  color: #7d9d9c;
  opacity: 1; /* Firefox */
}

:-ms-input-placeholder {
  /* Internet Explorer 10-11 */
  font-size: 16px;
  color: #7d9d9c;
}

::-ms-input-placeholder {
  /* Microsoft Edge */
  font-size: 16px;
  color: #7d9d9c;
}
</style>
