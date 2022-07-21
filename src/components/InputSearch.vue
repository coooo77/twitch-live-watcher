<template>
  <div
    class="searchBar flex flex-nowrap items-center gap-2 bg-themeColor2 border-themeColor4 border rounded-3xl pr-2 pl-4"
  >
    <input
      class="w-full bg-[transparent] outline-none"
      :disabled="disableInput"
      :placeholder="placeholder"
      v-model="_inputValue"
      type="text"
    />

    <Icon
      class="text-themeColor4 ml-auto cursor-pointer"
      :class="{'pointer-events-none': disableSearch}"
      icon="ic:outline-search"
      :width="iconSize"
      :height="iconSize"
      @click="$emit('search')"
    />
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'
import { Icon } from '@iconify/vue'

const iconSize = 30

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disableInput?: boolean
    disableSearch: boolean
  }>(),
  {
    placeholder: '',
    disableInput: false
  }
)

const emit = defineEmits<{
  (eventName: 'search'): void
  (eventName: 'update:modelValue', value: string): void
}>()

const _inputValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})
</script>

<style scoped>
::placeholder {
  /* Chrome, Firefox, Opera, Safari 10.1+ */
  font-size: 16px;
  color: #7D9D9C;
  opacity: 1; /* Firefox */
}

:-ms-input-placeholder {
  /* Internet Explorer 10-11 */
  font-size: 16px;
  color: #7D9D9C;
}

::-ms-input-placeholder {
  /* Microsoft Edge */
  font-size: 16px;
  color: #7D9D9C;
}
</style>
