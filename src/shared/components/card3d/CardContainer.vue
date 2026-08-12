<script setup lang="ts">
import { provide, useTemplateRef } from 'vue'
import { useMouseState } from './useMouseState'

defineProps<{ containerClass?: string }>()

const containerRef = useTemplateRef('containerRef')

const mouseState = useMouseState()
provide('use3DCardMouseState', mouseState)

function handleMouseMove(e: MouseEvent) {
  if (!containerRef.value) return
  const { left, top, width, height } =
    containerRef.value.getBoundingClientRect()
  const x = (e.clientX - left - width / 2) / 25
  const y = (e.clientY - top - height / 2) / 25
  containerRef.value.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
}

function handleMouseEnter() {
  mouseState.setMouseEntered(true)
}

function handleMouseLeave() {
  if (!containerRef.value) return
  mouseState.setMouseEntered(false)
  containerRef.value.style.transform = 'rotateY(0deg) rotateX(0deg)'
}
</script>

<template>
  <div class="card3d-perspective" :class="containerClass">
    <div
      ref="containerRef"
      class="card3d-container"
      @mouseenter="handleMouseEnter"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.card3d-perspective {
  perspective: 1000px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.card3d-container {
  transform-style: preserve-3d;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 200ms ease-linear;
}
</style>
