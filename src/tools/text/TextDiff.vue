<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker'
import { useAppStore } from '@/stores/app'
import { downloadText, readFromClipboard } from '@/shared/utils/download'
import { ElMessage } from 'element-plus'

// 手动配置 Monaco worker，使用 Vite ?worker 导入，
// 使 worker 输出到 assets 目录并跟随 base，保证子路径部署下可加载。
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new JsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    return new EditorWorker()
  },
}

const appStore = useAppStore()

const leftText = ref('Hello World\nThis is line 2\nThis is line 3\nThis is line 4')
const rightText = ref('Hello World\nThis is modified line 2\nThis is line 3\nThis is new line')

const language = ref('plaintext')
const renderSideBySide = ref(true)
const diffContainerRef = ref<HTMLElement>()
const diffEditor = shallowRef<monaco.editor.IStandaloneDiffEditor | null>(null)
const diffCount = ref(0)

const languages = [
  { label: '纯文本', value: 'plaintext' },
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'SQL', value: 'sql' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'Shell', value: 'shell' },
  { label: 'YAML', value: 'yaml' },
]

function createDiffEditor() {
  if (!diffContainerRef.value) return

  diffEditor.value = monaco.editor.createDiffEditor(diffContainerRef.value, {
    theme: appStore.isDark ? 'vs-dark' : 'vs',
    renderSideBySide: renderSideBySide.value,
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    originalEditable: true,
  })

  const originalModel = monaco.editor.createModel(leftText.value, language.value)
  const modifiedModel = monaco.editor.createModel(rightText.value, language.value)

  diffEditor.value.setModel({ original: originalModel, modified: modifiedModel })

  originalModel.onDidChangeContent(() => {
    leftText.value = originalModel.getValue()
  })
  modifiedModel.onDidChangeContent(() => {
    rightText.value = modifiedModel.getValue()
  })

  diffEditor.value.onDidUpdateDiff(() => {
    const changes = diffEditor.value?.getLineChanges()?.length ?? 0
    diffCount.value = changes
  })
}

function swapText() {
  const tmp = leftText.value
  leftText.value = rightText.value
  rightText.value = tmp
  const model = diffEditor.value?.getModel()
  if (model) {
    model.original.setValue(leftText.value)
    model.modified.setValue(rightText.value)
  }
}

async function pasteLeft() {
  try {
    leftText.value = await readFromClipboard()
    diffEditor.value?.getModel()?.original.setValue(leftText.value)
  } catch {
    ElMessage.error('无法读取剪贴板')
  }
}

async function pasteRight() {
  try {
    rightText.value = await readFromClipboard()
    diffEditor.value?.getModel()?.modified.setValue(rightText.value)
  } catch {
    ElMessage.error('无法读取剪贴板')
  }
}

function clearAll() {
  leftText.value = ''
  rightText.value = ''
  diffEditor.value?.getModel()?.original.setValue('')
  diffEditor.value?.getModel()?.modified.setValue('')
  diffCount.value = 0
}

function downloadDiff() {
  const content = `=== 原始文本 ===\n${leftText.value}\n\n=== 修改文本 ===\n${rightText.value}\n\n=== 差异行数: ${diffCount.value} ===\n`
  downloadText(content, 'diff-result.txt', 'text/plain')
}

watch(language, (lang) => {
  const model = diffEditor.value?.getModel()
  if (model) {
    monaco.editor.setModelLanguage(model.original, lang)
    monaco.editor.setModelLanguage(model.modified, lang)
  }
})

watch(renderSideBySide, (val) => {
  diffEditor.value?.updateOptions({ renderSideBySide: val })
})

watch(() => appStore.isDark, (isDark) => {
  monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs')
})

onMounted(createDiffEditor)

onBeforeUnmount(() => {
  diffEditor.value?.dispose()
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>文本对比</h2>
      <p>并排对比两段文本，高亮差异行，支持多种语言语法</p>
    </div>

    <div class="tool-page__toolbar">
      <el-select v-model="language" placeholder="语言" style="width: 140px">
        <el-option
          v-for="lang in languages"
          :key="lang.value"
          :label="lang.label"
          :value="lang.value"
        />
      </el-select>
      <el-switch
        v-model="renderSideBySide"
        active-text="并排"
        inactive-text="内联"
      />
      <el-button @click="swapText">交换</el-button>
      <el-button @click="pasteLeft">粘贴左</el-button>
      <el-button @click="pasteRight">粘贴右</el-button>
      <el-button @click="clearAll">清空</el-button>
      <el-button @click="downloadDiff">下载</el-button>
      <el-tag v-if="diffCount > 0" type="warning">{{ diffCount }} 处差异</el-tag>
      <el-tag v-else type="success">无差异</el-tag>
    </div>

    <div class="tool-page__content">
      <div ref="diffContainerRef" class="diff-editor" />
    </div>
  </div>
</template>

<style scoped>
.diff-editor {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>
