<template>
  <div
    class="cardSearch relative generalShadow overflow-hidden rounded-lg border border-themeColor4 bg-themeColor1 flex flex-col"
  >
    <div
      class="header h-0 pb-[56.25%] border-b bg-themeColor4 relative"
    >
      <div class="cardLayout absolute inset-0 flex">
        <div class="views absolute top-2 left-2 text">
          {{ video.view_count }} views
        </div>

        <div class="duration absolute bottom-2 right-2 text">
          {{ video.duration }}
        </div>

        <img
          v-show="imgUrl"
          class="thumbnail w-full border-themeColor4"
          :src="imgUrl"
          :alt="video.id"
        />

        <div
          v-show="imgUrl === ''"
          class="noImg text-themeColor1 font-bold text-center m-auto text-xl"
        >
          NO IMAGE
        </div>
      </div>
    </div>

    <div
      class="footer grid grid-rows-[min-content,min-content] grid-cols-[1fr,min-content] gap-1 p-2"
    >
      <div
        :title="video.title"
        class="title text-themeColor4 font-bold whitespace-nowrap truncate"
      >
        {{ video.title }}
      </div>

      <div
        class="publishTime text-themeColor4 font-bold whitespace-nowrap truncate"
      >
        {{ displayTime }}
      </div>

      <div
        class="box col-start-2 row-start-1 row-end-3 m-auto flex border-4 rounded p-1 border-themeColor4 cursor-pointer"
        @click="$emit('addVideo')"
      >
        <Icon
          class="text-themeColor4 min-w-[30px] m-auto"
          icon="fa6-solid:download"
          :width="iconSize"
          :height="iconSize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IVod } from '../api/user'
import { Icon } from '@iconify/vue'
import { getUrlAndPublish } from '../composable/download'

const iconSize = 30

const props = defineProps<{
  video: IVod
}>()

defineEmits<{
  (eventName: 'addVideo'): void
}>()

const { thumbnail_url, published_at } = toRefs(props.video)

const { imgUrl, displayTime } = getUrlAndPublish(
  thumbnail_url.value,
  published_at.value
)
</script>

<style scoped>
.text {
  @apply px-2 rounded-md text-themeColor1 bg-themeColor4 border border-themeColor1 text-center;
}
</style>
