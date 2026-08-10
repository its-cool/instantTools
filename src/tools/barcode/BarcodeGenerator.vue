<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import JsBarcode from 'jsbarcode'
import { saveAs } from 'file-saver'

const content = ref('123456789012')
const format = ref<'CODE128' | 'EAN13' | 'UPC' | 'CODE39'>('CODE128')
const width = ref(2)
const height = ref(80)
const displayValue = ref(true)
const lineColor = ref('#000000')
const background = ref('#ffffff')
const svgRef = ref<SVGElement>()

function render() {
  if (!svgRef.value || !content.value.trim()) return
  try {
    JsBarcode(svgRef.value, content.value, {
      format: format.value,
      width: width.value,
      height: height.value,
      displayValue: displayValue.value,
      lineColor: lineColor.value,
      background: background.value,
      margin: 10,
    })
  } catch {
    // invalid barcode content for format
  }
}

function downloadSvg() {
  if (!svgRef.value) return
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgRef.value)
  const blob = new Blob([source], { type: 'image/svg+xml' })
  saveAs(blob, 'barcode.svg')
}

function downloadPng() {
  if (!svgRef.value) return
  const svgData = new XMLSerializer().serializeToString(svgRef.value)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    if (ctx) {
      ctx.fillStyle = background.value
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((pngBlob) => {
        if (pngBlob) saveAs(pngBlob, 'barcode.png')
        URL.revokeObjectURL(url)
      })
    }
  }
  img.src = url
}

onMounted(render)
watch([content, format, width, height, displayValue, lineColor, background], render)
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>条形码生成</h2>
      <p>支持 CODE128、EAN-13、UPC、CODE39 等格式</p>
    </div>

    <div class="barcode-layout">
      <el-card header="配置">
        <el-form label-width="90px">
          <el-form-item label="内容">
            <el-input v-model="content" />
          </el-form-item>
          <el-form-item label="格式">
            <el-select v-model="format">
              <el-option label="CODE128" value="CODE128" />
              <el-option label="EAN-13" value="EAN13" />
              <el-option label="UPC" value="UPC" />
              <el-option label="CODE39" value="CODE39" />
            </el-select>
          </el-form-item>
          <el-form-item label="线宽">
            <el-slider v-model="width" :min="1" :max="4" :step="0.5" />
          </el-form-item>
          <el-form-item label="高度">
            <el-slider v-model="height" :min="40" :max="150" />
          </el-form-item>
          <el-form-item label="显示文字">
            <el-switch v-model="displayValue" />
          </el-form-item>
          <el-form-item label="线条颜色">
            <el-color-picker v-model="lineColor" />
          </el-form-item>
          <el-form-item label="背景色">
            <el-color-picker v-model="background" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card header="预览">
        <div class="preview-box">
          <svg ref="svgRef" />
        </div>
        <div class="preview-actions">
          <el-button type="primary" @click="downloadPng">下载 PNG</el-button>
          <el-button @click="downloadSvg">下载 SVG</el-button>
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
  min-height: 200px;
  padding: 24px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  overflow-x: auto;
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
