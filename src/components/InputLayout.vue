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
      @keyup.enter="$emit('enter')"
    />

    <slot name="icon" />
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'

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
  (eventName: 'update:modelValue', value: string): void
  (eventName: 'enter'): void
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
  opacity: 1;
  /* Firefox */
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
