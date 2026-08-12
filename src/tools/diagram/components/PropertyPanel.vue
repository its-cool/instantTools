<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Cell, Edge, Graph, Node } from '@antv/x6'

const props = defineProps<{
  graph: Graph | null
}>()

type SelectionType = 'none' | 'node' | 'edge'

const selectionType = ref<SelectionType>('none')
let selectedCell: Cell | null = null

const nodeLabel = ref('')
const nodeFill = ref('#EFF4FF')
const nodeStroke = ref('#5F95FF')
const nodeStrokeWidth = ref(1.5)
const nodeRx = ref(8)
const nodeFontSize = ref(14)
const nodeFontColor = ref('#262626')
const nodeFontFamily = ref('system-ui')

const edgeConnector = ref<'normal' | 'rounded' | 'smooth' | 'jumpover'>('rounded')
const edgeStroke = ref('#A2B1C3')
const edgeStrokeWidth = ref(2)
const edgeDashed = ref(false)
const edgeDashArray = ref('5,5')
const edgeSourceMarker = ref<'none' | 'block' | 'classic' | 'diamond' | 'circle' | 'open'>('none')
const edgeTargetMarker = ref<'none' | 'block' | 'classic' | 'diamond' | 'circle' | 'open'>('none')

const fontFamilies = [
  { label: '系统默认', value: 'system-ui' },
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '楷体', value: 'KaiTi, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
]

const connectorOptions = [
  { label: '直线', value: 'normal' },
  { label: '圆角折线', value: 'rounded' },
  { label: '曲线', value: 'smooth' },
  { label: '跳线', value: 'jumpover' },
]

const arrowOptions = [
  { label: '无箭头', value: 'none' },
  { label: '实心箭头', value: 'block' },
  { label: '经典箭头', value: 'classic' },
  { label: '菱形', value: 'diamond' },
  { label: '圆形', value: 'circle' },
  { label: '空心箭头', value: 'open' },
]

function getMarkerConfig(type: string): { name: string;[key: string]: unknown } | null {
  if (type === 'none') return null
  const configs: Record<string, { name: string;[key: string]: unknown }> = {
    block: { name: 'block', width: 10, height: 6 },
    classic: { name: 'classic', width: 10, height: 6 },
    diamond: { name: 'diamond', width: 8, height: 8 },
    circle: { name: 'circle', r: 4 },
    open: { name: 'open', width: 10, height: 6 },
  }
  return configs[type] ?? null
}

function syncFromNode(node: Node) {
  nodeLabel.value = (node.attr('label/text') as string) ?? node.prop('label') ?? ''
  nodeFill.value = (node.attr('body/fill') as string) ?? '#EFF4FF'
  nodeStroke.value = (node.attr('body/stroke') as string) ?? '#5F95FF'
  nodeStrokeWidth.value = Number(node.attr('body/strokeWidth') ?? 1.5)
  nodeRx.value = Number(node.attr('body/rx') ?? 8)
  nodeFontSize.value = Number(node.attr('label/fontSize') ?? 14)
  nodeFontColor.value = (node.attr('label/fill') as string) ?? '#262626'
  nodeFontFamily.value = (node.attr('label/fontFamily') as string) ?? 'system-ui'
}

function getMarkerName(marker: unknown): string {
  if (marker == null) return 'none'
  if (typeof marker === 'object' && marker !== null && 'name' in marker) {
    return (marker as { name: string }).name
  }
  return 'block'
}

function syncFromEdge(edge: Edge) {
  const connector = edge.getConnector()
  edgeConnector.value = (connector?.name as typeof edgeConnector.value) ?? 'rounded'
  edgeStroke.value = (edge.attr('line/stroke') as string) ?? '#A2B1C3'
  edgeStrokeWidth.value = Number(edge.attr('line/strokeWidth') ?? 2)
  const dashArray = edge.attr('line/strokeDasharray') as string | undefined
  edgeDashed.value = Boolean(dashArray && dashArray !== 'none')
  edgeDashArray.value = dashArray ?? '5,5'
  const sourceMarker = edge.attr('line/sourceMarker')
  const targetMarker = edge.attr('line/targetMarker')
  edgeSourceMarker.value = getMarkerName(sourceMarker) as typeof edgeSourceMarker.value
  edgeTargetMarker.value = getMarkerName(targetMarker) as typeof edgeTargetMarker.value
}

function syncFromCell(cell: Cell | null) {
  selectedCell = cell
  if (!cell) {
    selectionType.value = 'none'
    return
  }
  if (cell.isNode()) {
    selectionType.value = 'node'
    syncFromNode(cell)
  } else if (cell.isEdge()) {
    selectionType.value = 'edge'
    syncFromEdge(cell)
  } else {
    selectionType.value = 'none'
  }
}

function applyNodeLabel() {
  if (!selectedCell?.isNode() || !props.graph) return
  selectedCell.setAttrByPath('label/text', nodeLabel.value)
  selectedCell.prop('label', nodeLabel.value)
}

function applyNodeFill() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('body/fill', nodeFill.value)
}

function applyNodeStroke() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('body/stroke', nodeStroke.value)
}

function applyNodeStrokeWidth() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('body/strokeWidth', nodeStrokeWidth.value)
}

function applyNodeRx() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('body/rx', nodeRx.value)
  selectedCell.setAttrByPath('body/ry', nodeRx.value)
}

function applyNodeFontSize() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('label/fontSize', nodeFontSize.value)
}

function applyNodeFontColor() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('label/fill', nodeFontColor.value)
}

function applyNodeFontFamily() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('label/fontFamily', nodeFontFamily.value)
}

function applyEdgeConnector() {
  if (!selectedCell?.isEdge()) return
  selectedCell.setConnector({ name: edgeConnector.value })
}

function applyEdgeStroke() {
  if (!selectedCell?.isEdge()) return
  selectedCell.setAttrByPath('line/stroke', edgeStroke.value)
}

function applyEdgeStrokeWidth() {
  if (!selectedCell?.isEdge()) return
  selectedCell.setAttrByPath('line/strokeWidth', edgeStrokeWidth.value)
}

function applyEdgeDashed() {
  if (!selectedCell?.isEdge()) return
  if (edgeDashed.value) {
    selectedCell.setAttrByPath('line/strokeDasharray', edgeDashArray.value)
  } else {
    selectedCell.setAttrByPath('line/strokeDasharray', null)
  }
}

function applyEdgeDashArray() {
  if (!selectedCell?.isEdge() || !edgeDashed.value) return
  selectedCell.setAttrByPath('line/strokeDasharray', edgeDashArray.value)
}

function applyEdgeSourceMarker() {
  if (!selectedCell?.isEdge()) return
  const marker = getMarkerConfig(edgeSourceMarker.value)
  selectedCell.setAttrByPath('line/sourceMarker', marker as never)
}

function applyEdgeTargetMarker() {
  if (!selectedCell?.isEdge()) return
  const marker = getMarkerConfig(edgeTargetMarker.value)
  selectedCell.setAttrByPath('line/targetMarker', marker as never)
}

watch(
  () => props.graph,
  (graph) => {
    if (!graph) return

    graph.on('selection:changed', ({ selected }) => {
      syncFromCell(selected[0] ?? null)
    })

    graph.on('cell:change:attrs', ({ cell }) => {
      if (selectedCell?.id === cell.id) {
        syncFromCell(cell)
      }
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="property-panel">
    <h4>属性</h4>

    <el-empty v-if="selectionType === 'none'" description="选择节点或连线编辑属性" :image-size="60" />

    <template v-else-if="selectionType === 'node'">
      <div class="prop-section">
        <div class="prop-section__title">内容</div>
        <el-form label-width="70px" size="small" @submit.prevent>
          <el-form-item label="文本">
            <el-input v-model="nodeLabel" @change="applyNodeLabel" @keydown.enter.prevent="applyNodeLabel" />
          </el-form-item>
        </el-form>
      </div>

      <div class="prop-section">
        <div class="prop-section__title">填充与边框</div>
        <el-form label-width="70px" size="small" @submit.prevent>
          <el-form-item label="背景色">
            <el-color-picker v-model="nodeFill" @change="applyNodeFill" show-alpha />
          </el-form-item>
          <el-form-item label="边框色">
            <el-color-picker v-model="nodeStroke" @change="applyNodeStroke" />
          </el-form-item>
          <el-form-item label="边框粗细">
            <el-slider v-model="nodeStrokeWidth" :min="0" :max="5" :step="0.5" @change="applyNodeStrokeWidth" />
          </el-form-item>
          <el-form-item label="圆角">
            <el-slider v-model="nodeRx" :min="0" :max="24" :step="1" @change="applyNodeRx" />
          </el-form-item>
        </el-form>
      </div>

      <div class="prop-section">
        <div class="prop-section__title">文字样式</div>
        <el-form label-width="70px" size="small" @submit.prevent>
          <el-form-item label="字号">
            <el-input-number v-model="nodeFontSize" :min="10" :max="48" @change="applyNodeFontSize" />
          </el-form-item>
          <el-form-item label="文字颜色">
            <el-color-picker v-model="nodeFontColor" @change="applyNodeFontColor" />
          </el-form-item>
          <el-form-item label="字体">
            <el-select v-model="nodeFontFamily" @change="applyNodeFontFamily" style="width: 100%">
              <el-option v-for="f in fontFamilies" :key="f.value" :label="f.label" :value="f.value" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </template>

    <template v-else-if="selectionType === 'edge'">
      <div class="prop-section">
        <div class="prop-section__title">连线样式</div>
        <el-form label-width="70px" size="small" @submit.prevent>
          <el-form-item label="线条类型">
            <el-select v-model="edgeConnector" @change="applyEdgeConnector" style="width: 100%">
              <el-option v-for="c in connectorOptions" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="线条颜色">
            <el-color-picker v-model="edgeStroke" @change="applyEdgeStroke" />
          </el-form-item>
          <el-form-item label="线条粗细">
            <el-slider v-model="edgeStrokeWidth" :min="1" :max="8" :step="0.5" @change="applyEdgeStrokeWidth" />
          </el-form-item>
          <el-form-item label="虚线">
            <el-switch v-model="edgeDashed" @change="applyEdgeDashed" />
          </el-form-item>
          <el-form-item v-if="edgeDashed" label="虚线样式">
            <el-input v-model="edgeDashArray" placeholder="例如 5,5" @change="applyEdgeDashArray"
              @keydown.enter.prevent="applyEdgeDashArray" />
          </el-form-item>
        </el-form>
      </div>

      <div class="prop-section">
        <div class="prop-section__title">箭头</div>
        <el-form label-width="70px" size="small" @submit.prevent>
          <el-form-item label="起点箭头">
            <el-select v-model="edgeSourceMarker" @change="applyEdgeSourceMarker" style="width: 100%">
              <el-option v-for="a in arrowOptions" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="终点箭头">
            <el-select v-model="edgeTargetMarker" @change="applyEdgeTargetMarker" style="width: 100%">
              <el-option v-for="a in arrowOptions" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </template>
  </div>
</template>

<style scoped>
.property-panel {
  padding: 12px;
  border-left: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
}

.property-panel h4 {
  margin: 0 0 12px;
  font-size: 14px;
}

.prop-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.prop-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.prop-section__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
