<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
const route = useRoute()
</script>

<template>
  <Layout>
    <Menu />
    <div class="pageView grow">
      <div class="pageTitle select-none border-b-[9px] text-[72px] font-bold text-themeColor4 leading-[80px] mb-2">
        {{ route.meta.title }}
      </div>
      <RouterView />
    </div>
  </Layout>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
</style>
