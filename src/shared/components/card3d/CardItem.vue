<script setup lang="ts">
import { inject, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useMouseState } from './useMouseState'

interface Props {
  as?: string
  class?: string
  translateX?: number
  translateY?: number
  translateZ?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
})

const refElement = ref<HTMLElement | null>(null)

const mouseState = inject(
  'use3DCardMouseState',
) as ReturnType<typeof useMouseState>

function handleAnimation(isMouseEntered: Readonly<Ref<boolean>>) {
  if (!refElement.value) return

  if (isMouseEntered.value) {
    refElement.value.style.transform = `translateX(${props.translateX}px) translateY(${props.translateY}px) translateZ(${props.translateZ}px) rotateX(${props.rotateX}deg) rotateY(${props.rotateY}deg) rotateZ(${props.rotateZ}deg)`
  } else {
    refElement.value.style.transform =
      'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)'
  }
}

watch(mouseState.isMouseEntered, handleAnimation, { immediate: true })
</script>

<template>
  <component
    :is="props.as"
    ref="refElement"
    class="card3d-item"
    :class="props.class"
  >
    <slot />
  </component>
</template>

<style scoped>
.card3d-item {
  transition: transform 500ms ease-in-out;
}
</style>
