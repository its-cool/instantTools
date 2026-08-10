<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useAppStore } from '@/stores/app'

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: string
    readOnly?: boolean
    minimap?: boolean
  }>(),
  {
    language: 'json',
    readOnly: false,
    minimap: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const appStore = useAppStore()
const containerRef = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!containerRef.value) return

  editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: appStore.isDark ? 'vs-dark' : 'vs',
    readOnly: props.readOnly,
    automaticLayout: true,
    minimap: { enabled: props.minimap },
    fontSize: 14,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
  })

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor?.getValue() ?? '')
  })
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor && editor.getValue() !== value) {
      editor.setValue(value)
    }
  },
)

watch(
  () => props.language,
  (language) => {
    if (editor) {
      monaco.editor.setModelLanguage(editor.getModel()!, language)
    }
  },
)

watch(
  () => appStore.isDark,
  (isDark) => {
    monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs')
  },
)

watch(
  () => props.readOnly,
  (readOnly) => {
    editor?.updateOptions({ readOnly })
  },
)

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="monaco-editor-container" />
</template>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
