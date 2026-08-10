<script setup lang="ts">
import { ref, computed } from 'vue'
import { colord } from './utils'
import { getContrastRatio, getWcagLevel } from './utils'
import CopyButton from '@/shared/components/CopyButton.vue'

const hue = ref(210)
const saturation = ref(70)
const lightness = ref(55)
const foreground = ref('#ffffff')
const background = ref('#409EFF')

const hslColor = computed(() => `hsl(${hue.value}, ${saturation.value}%, ${lightness.value}%)`)
const hexColor = computed(() => colord(hslColor.value).toHex())

const contrastRatio = computed(() => getContrastRatio(foreground.value, background.value))
const wcag = computed(() => getWcagLevel(contrastRatio.value))

function applyHslToBackground() {
  background.value = hexColor.value
}

function swapColors() {
  const temp = foreground.value
  foreground.value = background.value
  background.value = temp
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>调色与对比度检测</h2>
      <p>HSL 滑块调节颜色，检测 WCAG 可读性对比度</p>
    </div>

    <div class="picker-layout">
      <el-card header="HSL 调色">
        <div class="slider-group">
          <label>H {{ hue }}</label>
          <el-slider v-model="hue" :min="0" :max="360" />
          <label>S {{ saturation }}%</label>
          <el-slider v-model="saturation" :min="0" :max="100" />
          <label>L {{ lightness }}%</label>
          <el-slider v-model="lightness" :min="0" :max="100" />
        </div>
        <div class="color-preview" :style="{ background: hexColor }">
          <code>{{ hexColor }}</code>
          <CopyButton :text="hexColor" />
        </div>
        <el-button type="primary" style="margin-top: 12px" @click="applyHslToBackground">
          应用到背景色
        </el-button>
      </el-card>

      <el-card header="对比度检测">
        <div class="contrast-preview" :style="{ background: background, color: foreground }">
          示例文字 The quick brown fox
        </div>

        <el-form label-width="80px" style="margin-top: 16px">
          <el-form-item label="前景色">
            <el-color-picker v-model="foreground" />
            <el-input v-model="foreground" style="width: 140px; margin-left: 8px" />
          </el-form-item>
          <el-form-item label="背景色">
            <el-color-picker v-model="background" />
            <el-input v-model="background" style="width: 140px; margin-left: 8px" />
          </el-form-item>
        </el-form>

        <el-button @click="swapColors">交换前景/背景</el-button>

        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="对比度">
            {{ contrastRatio.toFixed(2) }} : 1
          </el-descriptions-item>
          <el-descriptions-item label="WCAG AA">
            <el-tag :type="wcag.aa ? 'success' : 'danger'">
              {{ wcag.aa ? '通过' : '未通过' }} (≥ 4.5)
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="WCAG AAA">
            <el-tag :type="wcag.aaa ? 'success' : 'warning'">
              {{ wcag.aaa ? '通过' : '未通过' }} (≥ 7)
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.picker-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.slider-group label {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
}

.color-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.contrast-preview {
  padding: 24px;
  border-radius: 8px;
  font-size: 18px;
  text-align: center;
}
</style>
