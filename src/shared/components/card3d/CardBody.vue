<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <div class="card3d-body" :class="class">
    <slot />
  </div>
</template>

<style scoped>
.card3d-body {
  transform-style: preserve-3d;
}
</style>
