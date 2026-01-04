<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style scoped>

.app-container {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
