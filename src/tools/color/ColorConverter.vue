<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { colord } from './utils'
import CopyButton from '@/shared/components/CopyButton.vue'

const input = ref('#409EFF')

const formats = computed(() => {
  const c = colord(input.value)
  if (!c.isValid()) return null
  return {
    hex: c.toHex(),
    rgb: c.toRgbString(),
    hsl: c.toHslString(),
    cmyk: c.toCmykString(),
  }
})

const previewColor = computed(() => (formats.value ? formats.value.hex : '#cccccc'))

watch(input, (value) => {
  if (!colord(value).isValid() && value.trim()) {
    // keep invalid state visible
  }
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>颜色格式转换</h2>
      <p>输入任意颜色格式，实时互转 HEX / RGB / HSL / CMYK</p>
    </div>

    <div class="converter">
      <div class="converter__preview" :style="{ background: previewColor }" />
      <div class="converter__form">
        <el-form label-width="80px">
          <el-form-item label="输入">
            <el-input v-model="input" placeholder="#409EFF 或 rgb(64,158,255)" />
          </el-form-item>
        </el-form>

        <el-alert v-if="!formats" type="error" title="无效的颜色值" :closable="false" />

        <el-descriptions v-else :column="1" border>
          <el-descriptions-item label="HEX">
            <span>{{ formats.hex }}</span>
            <CopyButton :text="formats.hex" />
          </el-descriptions-item>
          <el-descriptions-item label="RGB">
            <span>{{ formats.rgb }}</span>
            <CopyButton :text="formats.rgb" />
          </el-descriptions-item>
          <el-descriptions-item label="HSL">
            <span>{{ formats.hsl }}</span>
            <CopyButton :text="formats.hsl" />
          </el-descriptions-item>
          <el-descriptions-item label="CMYK">
            <span>{{ formats.cmyk }}</span>
            <CopyButton :text="formats.cmyk" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: start;
}

.converter__preview {
  height: 200px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
}

.converter__form :deep(.el-descriptions__cell) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 768px) {
  .converter {
    grid-template-columns: 1fr;
  }
}
</style>
