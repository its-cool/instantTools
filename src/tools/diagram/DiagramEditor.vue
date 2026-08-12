<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Graph } from '@antv/x6'
import Toolbar from './components/Toolbar.vue'
import ShapePanel from './components/ShapePanel.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import { createGraphInstance } from './hooks/useGraph'
import { importJson } from './utils/export'
import { getDiagramTemplate } from './templates'
import type { DiagramType } from './types'
import { getStorageKey } from './types'
import {
  addMindmapChild,
  addMindmapList,
  addMindmapSibling,
  bindMindmapGraph,
  getMindmapRoot,
  relayoutMindmap,
  restoreMindmap,
  unbindMindmapGraph,
} from './mindmap'
import { getItem, setItem } from '@/shared/utils/storage'

const route = useRoute()
const containerRef = ref<HTMLElement>()
const minimapRef = ref<HTMLElement>()
const graphRef = shallowRef<Graph | null>(null)
const canUndo = ref(false)
const canRedo = ref(false)

const diagramType = computed<DiagramType>(() => {
  const path = route.path
  if (path.includes('sequence')) return 'sequence'
  if (path.includes('usecase')) return 'usecase'
  return 'mindmap'
})

const template = computed(() => getDiagramTemplate(diagramType.value))
const isMindmap = computed(() => diagramType.value === 'mindmap')

let saveTimer: ReturnType<typeof setTimeout> | null = null

async function loadDraft() {
  const saved = await getItem<object>(getStorageKey(diagramType.value))
  if (saved && graphRef.value) {
    try {
      graphRef.value.fromJSON(saved)
      if (isMindmap.value) {
        restoreMindmap(graphRef.value)
      }
      return true
    } catch {
      return false
    }
  }
  return false
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    if (graphRef.value) {
      await setItem(getStorageKey(diagramType.value), graphRef.value.toJSON())
    }
  }, 800)
}

function bindGraphEvents(graph: Graph) {
  graph.on('history:change', () => {
    canUndo.value = graph.canUndo()
    canRedo.value = graph.canRedo()
  })
  graph.on('cell:added cell:removed cell:changed', scheduleSave)
}

function setupMindmapMode(graph: Graph) {
  unbindMindmapGraph(graph)
  bindMindmapGraph(graph)
}

function initGraph() {
  if (!containerRef.value) return

  if (graphRef.value) {
    unbindMindmapGraph(graphRef.value)
    graphRef.value.dispose()
  }

  const graph = createGraphInstance({
    containerRef,
    minimapRef,
    diagramType: diagramType.value,
  })

  graphRef.value = graph
  bindGraphEvents(graph)

  if (isMindmap.value) {
    setupMindmapMode(graph)
  }

  void loadDraft().then((loaded) => {
    if (!loaded) {
      graph.clearCells()
      template.value.initGraph(graph)
    }
  })
}

function getTargetNode() {
  const graph = graphRef.value
  if (!graph) return null
  const selected = graph.getSelectedCells()[0]
  if (selected?.isNode()) return selected
  return getMindmapRoot(graph)
}

function handleUndo() {
  graphRef.value?.undo()
}

function handleRedo() {
  graphRef.value?.redo()
}

function handleAddChild() {
  if (!isMindmap.value || !graphRef.value) {
    ElMessage.info('子节点功能适用于思维导图')
    return
  }
  const target = getTargetNode()
  if (!target) return
  const child = addMindmapChild(graphRef.value, target.id)
  if (child) {
    graphRef.value.cleanSelection()
    graphRef.value.select(child)
  }
}

function handleAddList() {
  if (!isMindmap.value || !graphRef.value) {
    ElMessage.info('列表功能适用于思维导图')
    return
  }
  const target = getTargetNode()
  if (!target) return
  const list = addMindmapList(graphRef.value, target.id)
  if (list) {
    graphRef.value.cleanSelection()
    graphRef.value.select(list)
  }
}

function handleAddSibling() {
  if (!graphRef.value) return
  const selected = graphRef.value.getSelectedCells()[0]
  if (!selected?.isNode()) {
    ElMessage.info('请先选中一个节点')
    return
  }
  const sibling = addMindmapSibling(graphRef.value, selected.id)
  if (sibling) {
    graphRef.value.cleanSelection()
    graphRef.value.select(sibling)
  } else {
    ElMessage.info('根节点不能添加同级节点')
  }
}

function handleRelayout() {
  if (!graphRef.value) return
  relayoutMindmap(graphRef.value)
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file || !graphRef.value) return
    const text = await file.text()
    try {
      importJson(graphRef.value, text)
      if (isMindmap.value) {
        restoreMindmap(graphRef.value)
      }
      ElMessage.success('导入成功')
    } catch {
      ElMessage.error('JSON 格式无效')
    }
  }
  input.click()
}

onMounted(initGraph)

watch(diagramType, () => {
  initGraph()
})

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
  if (graphRef.value) unbindMindmapGraph(graphRef.value)
  graphRef.value?.dispose()
})
</script>

<template>
  <div class="diagram-editor">
    <div class="diagram-editor__header">
      <div>
        <h2>{{ template.label }}</h2>
        <p v-if="isMindmap">
          Tab 子节点 · Enter 同级 · F2/双击编辑 · 点击节点右上角 −/+ 折叠展开 · Delete 删除 · 列表节点每行一个条目
        </p>
        <p v-else>可视化拖拽编辑，支持撤销重做、导入导出与本地自动保存</p>
      </div>
      <Toolbar :graph="graphRef" :can-undo="canUndo" :can-redo="canRedo" :is-mindmap="isMindmap" @undo="handleUndo"
        @redo="handleRedo" @import="handleImport" @add-child="handleAddChild" @add-list="handleAddList"
        @add-sibling="handleAddSibling" @relayout="handleRelayout" />
    </div>

    <div class="diagram-editor__body">
      <ShapePanel :graph="graphRef" :shapes="template.shapes" :diagram-type="diagramType" />
      <div class="diagram-editor__canvas-wrap">
        <div ref="containerRef" class="diagram-editor__canvas" />
        <div ref="minimapRef" class="diagram-editor__minimap" />
      </div>
      <PropertyPanel :graph="graphRef" />
    </div>
  </div>
</template>

<style scoped>
.diagram-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  gap: 12px;
}

.diagram-editor__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}

.diagram-editor__header h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.diagram-editor__header p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.diagram-editor__body {
  display: flex;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.diagram-editor__canvas-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.diagram-editor__canvas {
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-blank);

  :deep(.x6-node) {
    &.has-tool-editing {

      .x6-widget-selection-box,
      .x6-node-selected-outline,
      .x6-node-selection {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    }
  }

  :deep(.x6-tool-editor-textarea) {
    resize: none;
    line-height: 20px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(31, 111, 235, 0.15);
  }
}

.diagram-editor__minimap {
  position: absolute;
  right: 12px;
  bottom: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}
</style>
