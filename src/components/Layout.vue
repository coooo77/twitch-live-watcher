<template>
  <div class="layout bg-themeColor1 rounded-lg h-full flex flex-col">
    <Navbar />
    
    <div class="content flex flex-col-reverse grow gap-3 p-3 md:px-3 md:flex-row">
      <slot />
    </div>
  </div>
</template>
