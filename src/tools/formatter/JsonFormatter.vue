<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MonacoEditor from '@/shared/components/MonacoEditor.vue'
import SplitPane from '@/shared/components/SplitPane.vue'
import CopyButton from '@/shared/components/CopyButton.vue'
import { downloadText, readFromClipboard } from '@/shared/utils/download'
import { formatJson, minifyJson } from './utils'

const input = ref('{\n  "name": "instant-tools",\n  "version": 1\n}')
const output = ref('')
const error = ref('')

function runFormat() {
  const result = formatJson(input.value)
  output.value = result.output
  error.value = result.error ?? ''
}

function runMinify() {
  const result = minifyJson(input.value)
  output.value = result.output
  error.value = result.error ?? ''
}

function applyOutputToInput() {
  if (output.value) {
    input.value = output.value
  }
}

async function pasteFromClipboard() {
  try {
    input.value = await readFromClipboard()
    runFormat()
  } catch {
    ElMessage.error('无法读取剪贴板')
  }
}

function downloadResult() {
  downloadText(output.value || input.value, 'data.json', 'application/json')
}

watch(input, runFormat, { immediate: true })
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>JSON 格式化</h2>
      <p>美化、压缩 JSON，实时语法校验</p>
    </div>

    <div class="tool-page__toolbar">
      <el-button type="primary" @click="runFormat">格式化</el-button>
      <el-button @click="runMinify">压缩</el-button>
      <el-button @click="applyOutputToInput">应用到输入</el-button>
      <el-button @click="pasteFromClipboard">从剪贴板粘贴</el-button>
      <CopyButton :text="output || input" />
      <el-button @click="downloadResult">下载</el-button>
      <el-tag v-if="error" type="danger">{{ error }}</el-tag>
      <el-tag v-else type="success">语法正确</el-tag>
    </div>

    <div class="tool-page__content">
      <SplitPane>
        <template #left>
          <div class="editor-pane">
            <div class="editor-pane__label">输入</div>
            <MonacoEditor v-model="input" language="json" />
          </div>
        </template>
        <template #right>
          <div class="editor-pane">
            <div class="editor-pane__label">输出</div>
            <MonacoEditor v-model="output" language="json" read-only />
          </div>
        </template>
      </SplitPane>
    </div>
  </div>
</template>

<style scoped>
.editor-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-pane__label {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}
</style>
