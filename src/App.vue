<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'

const analytics = useAnalyticsStore()

function handleBeforeUnload() {
  analytics.trackLeave()
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <router-view />
</template>
