<script setup lang="ts">
import { ref, watch } from 'vue'
import MonacoEditor from '@/shared/components/MonacoEditor.vue'
import SplitPane from '@/shared/components/SplitPane.vue'
import CopyButton from '@/shared/components/CopyButton.vue'
import { downloadText } from '@/shared/utils/download'
import { jsonToXml, xmlToJson } from './converter'

const direction = ref<'json2xml' | 'xml2json'>('json2xml')
const input = ref('{\n  "user": {\n    "@_id": "1",\n    "name": "张三",\n    "roles": ["admin", "editor"]\n  }\n}')
const output = ref('')
const error = ref('')

function convert() {
  error.value = ''
  if (direction.value === 'json2xml') {
    const result = jsonToXml(input.value)
    output.value = result.output
    error.value = result.error ?? ''
  } else {
    const result = xmlToJson(input.value)
    output.value = result.output
    error.value = result.error ?? ''
  }
}

function swapDirection() {
  direction.value = direction.value === 'json2xml' ? 'xml2json' : 'json2xml'
  if (output.value) {
    input.value = output.value
  }
  convert()
}

function downloadResult() {
  const ext = direction.value === 'json2xml' ? 'xml' : 'json'
  const mime = direction.value === 'json2xml' ? 'application/xml' : 'application/json'
  downloadText(output.value, `converted.${ext}`, mime)
}

watch([input, direction], convert, { immediate: true })
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>JSON ↔ XML 转换</h2>
      <p>JSON 与 XML 双向互转，保留层级结构</p>
    </div>

    <div class="tool-page__toolbar">
      <el-radio-group v-model="direction">
        <el-radio-button value="json2xml">JSON → XML</el-radio-button>
        <el-radio-button value="xml2json">XML → JSON</el-radio-button>
      </el-radio-group>
      <el-button @click="swapDirection">交换方向</el-button>
      <CopyButton :text="output" />
      <el-button @click="downloadResult">下载</el-button>
      <el-tag v-if="error" type="danger">{{ error }}</el-tag>
    </div>

    <div class="tool-page__content">
      <SplitPane>
        <template #left>
          <div class="editor-pane">
            <div class="editor-pane__label">
              {{ direction === 'json2xml' ? 'JSON 输入' : 'XML 输入' }}
            </div>
            <MonacoEditor
              v-model="input"
              :language="direction === 'json2xml' ? 'json' : 'xml'"
            />
          </div>
        </template>
        <template #right>
          <div class="editor-pane">
            <div class="editor-pane__label">
              {{ direction === 'json2xml' ? 'XML 输出' : 'JSON 输出' }}
            </div>
            <MonacoEditor
              v-model="output"
              :language="direction === 'json2xml' ? 'xml' : 'json'"
              read-only
            />
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
