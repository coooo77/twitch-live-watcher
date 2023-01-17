<template>
  <div ref="observerEl" class="observer flex h-px" />
</template>

<script setup lang="ts">
const props = defineProps<{
  observeTarget?: HTMLElement
}>()

const emit = defineEmits<{
  (e: 'intersect', value: IntersectionObserver): void
  (e: 'notIntersect', value: IntersectionObserver): void
}>()

const observerEl = ref<HTMLElement>()

const observer = ref<null | IntersectionObserver>(null)

const setObserver = () => {
  const option = {
    root: props.observeTarget,
    rootMargin: '0px',
    threshold: 0
  }

  return new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry?.isIntersecting) {
        emit('intersect', observer)
      } else {
        emit('notIntersect', observer)
      }
    }, option)
  })
}

onMounted(() => {
  observer.value = setObserver()

  if (!observerEl.value) return

  observer.value.observe(observerEl.value)
})
</script>
