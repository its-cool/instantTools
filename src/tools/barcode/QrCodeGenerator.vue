<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { saveAs } from 'file-saver'
import CopyButton from '@/shared/components/CopyButton.vue'

const content = ref('https://example.com')
const size = ref(256)
const errorLevel = ref<'L' | 'M' | 'Q' | 'H'>('M')
const foreground = ref('#000000')
const background = ref('#ffffff')
const dataUrl = ref('')
const svgContent = ref('')

async function generate() {
  if (!content.value.trim()) {
    dataUrl.value = ''
    svgContent.value = ''
    return
  }

  const options = {
    width: size.value,
    margin: 2,
    errorCorrectionLevel: errorLevel.value,
    color: {
      dark: foreground.value,
      light: background.value,
    },
  }

  dataUrl.value = await QRCode.toDataURL(content.value, options)
  svgContent.value = await QRCode.toString(content.value, { ...options, type: 'svg' })
}

function downloadPng() {
  if (!dataUrl.value) return
  saveAs(dataUrl.value, 'qrcode.png')
}

function downloadSvg() {
  if (!svgContent.value) return
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml' })
  saveAs(blob, 'qrcode.svg')
}

watch([content, size, errorLevel, foreground, background], generate, { immediate: true })
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>二维码生成</h2>
      <p>自定义内容、尺寸、容错级别与颜色</p>
    </div>

    <div class="barcode-layout">
      <el-card header="配置">
        <el-form label-width="90px">
          <el-form-item label="内容">
            <el-input v-model="content" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="尺寸">
            <el-slider v-model="size" :min="128" :max="512" :step="32" show-input />
          </el-form-item>
          <el-form-item label="容错级别">
            <el-radio-group v-model="errorLevel">
              <el-radio-button value="L">L</el-radio-button>
              <el-radio-button value="M">M</el-radio-button>
              <el-radio-button value="Q">Q</el-radio-button>
              <el-radio-button value="H">H</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="前景色">
            <el-color-picker v-model="foreground" />
          </el-form-item>
          <el-form-item label="背景色">
            <el-color-picker v-model="background" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card header="预览">
        <div class="preview-box">
          <img v-if="dataUrl" :src="dataUrl" alt="QR Code" />
          <el-empty v-else description="请输入内容" />
        </div>
        <div class="preview-actions">
          <el-button type="primary" :disabled="!dataUrl" @click="downloadPng">
            下载 PNG
          </el-button>
          <el-button :disabled="!svgContent" @click="downloadSvg">下载 SVG</el-button>
          <CopyButton v-if="content" :text="content" label="复制内容" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.barcode-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.preview-box img {
  max-width: 100%;
}

.preview-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .barcode-layout {
    grid-template-columns: 1fr;
  }
}
</style>
