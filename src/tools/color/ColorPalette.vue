<script setup lang="ts">
import { ref, computed } from 'vue'
import CopyButton from '@/shared/components/CopyButton.vue'
import {
  generatePalette,
  randomColor,
  SCHEME_LABELS,
  type PaletteScheme,
} from './utils'

const baseColor = ref('#409EFF')
const scheme = ref<PaletteScheme>('analogous')

const palette = computed(() => generatePalette(baseColor.value, scheme.value))

function randomize() {
  baseColor.value = randomColor()
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>配色生成</h2>
      <p>基于基色生成多种和谐配色方案</p>
    </div>

    <div class="tool-page__toolbar">
      <el-color-picker v-model="baseColor" show-alpha />
      <el-input v-model="baseColor" style="width: 140px" />
      <el-select v-model="scheme" style="width: 160px">
        <el-option
          v-for="(label, key) in SCHEME_LABELS"
          :key="key"
          :label="label"
          :value="key"
        />
      </el-select>
      <el-button @click="randomize">随机基色</el-button>
    </div>

    <div class="palette-grid">
      <div v-for="(color, index) in palette" :key="index" class="palette-card">
        <div class="palette-card__swatch" :style="{ background: color }" />
        <div class="palette-card__info">
          <code>{{ color }}</code>
          <CopyButton :text="color" label="复制" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.palette-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.palette-card__swatch {
  height: 100px;
}

.palette-card__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  gap: 8px;
}

.palette-card__info code {
  font-size: 13px;
}
</style>
