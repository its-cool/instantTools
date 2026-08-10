<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import type { Graph } from '@antv/x6'
import { centerGraph, fitGraph, zoomGraph } from '../hooks/useGraph'
import { exportJson, exportPng, exportSvg } from '../utils/export'

const props = defineProps<{
  graph: Graph | null
  canUndo: boolean
  canRedo: boolean
  isMindmap?: boolean
}>()

const emit = defineEmits<{
  undo: []
  redo: []
  import: []
  addChild: []
  addSibling: []
  relayout: []
}>()

function handleZoomIn() {
  if (props.graph) zoomGraph(props.graph, 0.1)
}

function handleZoomOut() {
  if (props.graph) zoomGraph(props.graph, -0.1)
}

function handleFit() {
  if (props.graph) fitGraph(props.graph)
}

function handleCenter() {
  if (props.graph) centerGraph(props.graph)
}

function handleExportJson() {
  if (props.graph) exportJson(props.graph)
}

function handleExportPng() {
  if (props.graph) exportPng(props.graph)
}

function handleExportSvg() {
  if (props.graph) exportSvg(props.graph)
}
</script>

<template>
  <div class="diagram-toolbar">
    <el-button-group>
      <el-button :disabled="!canUndo" @click="emit('undo')">撤销</el-button>
      <el-button :disabled="!canRedo" @click="emit('redo')">重做</el-button>
    </el-button-group>

    <el-button-group>
      <el-button @click="handleZoomIn">放大</el-button>
      <el-button @click="handleZoomOut">缩小</el-button>
      <el-button @click="handleFit">适应</el-button>
      <el-button @click="handleCenter">居中</el-button>
    </el-button-group>

    <template v-if="isMindmap">
      <el-button-group>
        <el-button @click="emit('addChild')">子节点</el-button>
        <el-button @click="emit('addSibling')">同级节点</el-button>
        <el-button @click="emit('relayout')">整理布局</el-button>
      </el-button-group>
    </template>
    <el-button v-else @click="emit('addChild')">添加子节点</el-button>

    <el-dropdown>
      <el-button type="primary">
        导出 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleExportJson">JSON</el-dropdown-item>
          <el-dropdown-item @click="handleExportPng">PNG</el-dropdown-item>
          <el-dropdown-item @click="handleExportSvg">SVG</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-button @click="emit('import')">导入 JSON</el-button>
  </div>
</template>

<style scoped>
.diagram-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>
