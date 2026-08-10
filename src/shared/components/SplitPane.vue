<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    defaultSize?: number
    minSize?: number
    maxSize?: number
  }>(),
  {
    defaultSize: 50,
    minSize: 20,
    maxSize: 80,
  },
)

const leftSize = ref(props.defaultSize)
const dragging = ref(false)
const containerRef = ref<HTMLElement>()

function onMouseDown(event: MouseEvent) {
  dragging.value = true
  event.preventDefault()
}

function onMouseMove(event: MouseEvent) {
  if (!dragging.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const percent = ((event.clientX - rect.left) / rect.width) * 100
  leftSize.value = Math.min(props.maxSize, Math.max(props.minSize, percent))
}

function onMouseUp() {
  dragging.value = false
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div ref="containerRef" class="split-pane" :class="{ dragging }">
    <div class="split-pane__left" :style="{ width: `${leftSize}%` }">
      <slot name="left" />
    </div>
    <div class="split-pane__divider" @mousedown="onMouseDown" />
    <div class="split-pane__right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.split-pane {
  display: flex;
  height: 100%;
  min-height: 400px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.split-pane.dragging {
  user-select: none;
  cursor: col-resize;
}

.split-pane__left,
.split-pane__right {
  height: 100%;
  overflow: hidden;
}

.split-pane__right {
  flex: 1;
}

.split-pane__divider {
  width: 6px;
  cursor: col-resize;
  background: var(--el-fill-color-light);
  transition: background 0.2s;
}

.split-pane__divider:hover {
  background: var(--el-color-primary-light-5);
}
</style>
