<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import CopyButton from '@/shared/components/CopyButton.vue'
import {
  generateAllThemes,
  themeToCssVars,
  randomColor,
  type ThemeScheme,
} from './utils'

const baseColor = ref('#409EFF')
const themes = computed<ThemeScheme[]>(() => generateAllThemes(baseColor.value))

function randomize() {
  baseColor.value = randomColor()
}

function copyCssVars(theme: ThemeScheme) {
  const css = themeToCssVars(theme)
  navigator.clipboard.writeText(css).then(() => {
    ElMessage.success(`已复制 ${theme.label} CSS 变量`)
  })
}

function exportAll() {
  const css = themes.value.map(themeToCssVars).join('\n\n')
  const blob = new Blob([css], { type: 'text/css' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'theme-variables.css'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>Web 主题配色</h2>
      <p>输入基础主题色，生成 Element Plus / Tailwind / Material / Ant Design / Bootstrap 五套配色方案</p>
    </div>

    <div class="tool-page__toolbar">
      <el-color-picker v-model="baseColor" show-alpha />
      <el-input v-model="baseColor" style="width: 140px" />
      <el-button @click="randomize">随机基色</el-button>
      <el-button @click="exportAll">导出全部 CSS</el-button>
    </div>

    <div class="theme-list">
      <section v-for="theme in themes" :key="theme.id" class="theme-card">
        <div class="theme-card__header">
          <h3>{{ theme.label }}</h3>
          <span class="theme-card__desc">{{ theme.description }}</span>
          <div class="theme-card__actions">
            <CopyButton :text="themeToCssVars(theme)" label="复制 CSS" />
            <el-button size="small" @click="copyCssVars(theme)">复制变量</el-button>
          </div>
        </div>

        <div v-for="group in theme.groups" :key="group.label" class="theme-card__group">
          <div class="theme-card__group-label">{{ group.label }}</div>
          <div class="theme-card__colors">
            <div
              v-for="color in group.colors"
              :key="color.name"
              class="color-chip"
            >
              <div
                class="color-chip__swatch"
                :style="{ background: color.hex }"
              />
              <div class="color-chip__info">
                <code class="color-chip__name">{{ color.name }}</code>
                <div class="color-chip__hex-row">
                  <code class="color-chip__hex">{{ color.hex }}</code>
                  <CopyButton :text="color.hex" label="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.theme-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.theme-card {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  overflow: hidden;
}

.theme-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}

.theme-card__header h3 {
  margin: 0;
  font-size: 16px;
  white-space: nowrap;
}

.theme-card__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  flex: 1;
}

.theme-card__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-card__group {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.theme-card__group:last-child {
  border-bottom: none;
}

.theme-card__group-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.theme-card__colors {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.color-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.color-chip:hover {
  border-color: var(--el-color-primary-light-5);
}

.color-chip__swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
}

.color-chip__info {
  flex: 1;
  min-width: 0;
}

.color-chip__name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-chip__hex-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-chip__hex {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
