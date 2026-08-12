<script setup lang="ts">
import {
  ArrowDown,
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Aim,
  Plus,
  DocumentCopy,
  Grid,
  Download,
  Upload,
  List,
} from '@element-plus/icons-vue'
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
  addList: []
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
      <el-tooltip content="撤销" placement="bottom">
        <el-button :disabled="!canUndo" @click="emit('undo')">
          <el-icon>
            <RefreshLeft />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="重做" placement="bottom">
        <el-button :disabled="!canRedo" @click="emit('redo')">
          <el-icon>
            <RefreshRight />
          </el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-button-group>
      <el-tooltip content="放大" placement="bottom">
        <el-button @click="handleZoomIn">
          <el-icon>
            <ZoomIn />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="缩小" placement="bottom">
        <el-button @click="handleZoomOut">
          <el-icon>
            <ZoomOut />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="适应画布" placement="bottom">
        <el-button @click="handleFit">
          <el-icon>
            <FullScreen />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="居中" placement="bottom">
        <el-button @click="handleCenter">
          <el-icon>
            <Aim />
          </el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <template v-if="isMindmap">
      <el-button-group>
        <el-tooltip content="添加子节点" placement="bottom">
          <el-button @click="emit('addChild')">
            <el-icon>
              <Plus />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="添加列表" placement="bottom">
          <el-button @click="emit('addList')">
            <el-icon>
              <List />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="添加同级节点" placement="bottom">
          <el-button @click="emit('addSibling')">
            <el-icon>
              <DocumentCopy />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="整理布局" placement="bottom">
          <el-button @click="emit('relayout')">
            <el-icon>
              <Grid />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </template>
    <el-tooltip v-else content="添加子节点" placement="bottom">
      <el-button @click="emit('addChild')">
        <el-icon>
          <Plus />
        </el-icon>
      </el-button>
    </el-tooltip>

    <el-dropdown>
      <el-tooltip content="导出" placement="bottom">
        <el-button type="primary">
          <el-icon>
            <Download />
          </el-icon>
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </el-button>
      </el-tooltip>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleExportJson">JSON</el-dropdown-item>
          <el-dropdown-item @click="handleExportPng">PNG</el-dropdown-item>
          <el-dropdown-item @click="handleExportSvg">SVG</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-tooltip content="导入 JSON" placement="bottom">
      <el-button @click="emit('import')">
        <el-icon>
          <Upload />
        </el-icon>
      </el-button>
    </el-tooltip>
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
