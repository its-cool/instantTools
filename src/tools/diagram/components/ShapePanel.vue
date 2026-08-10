<script setup lang="ts">
import type { Graph } from '@antv/x6'
import type { DiagramType, ShapeDefinition } from '../types'
import { getMindmapRoot, relayoutMindmap } from '../mindmap'

const props = defineProps<{
  graph: Graph | null
  shapes: ShapeDefinition[]
  diagramType?: DiagramType
}>()

function addShape(shape: ShapeDefinition) {
  if (!props.graph) return

  if (props.diagramType === 'mindmap' && shape.type === 'mindmap-node') {
    const root = getMindmapRoot(props.graph)
    const node = props.graph.addNode({
      shape: shape.type,
      x: 120 + Math.random() * 80,
      y: 120 + Math.random() * 80,
      label: '新节点',
      data: { level: root ? 1 : 0, collapsed: false },
    })
    props.graph.cleanSelection()
    props.graph.select(node)
    relayoutMindmap(props.graph)
    return
  }

  const node = props.graph.addNode({
    shape: shape.type,
    x: 120 + Math.random() * 80,
    y: 120 + Math.random() * 80,
    width: shape.width,
    height: shape.height,
    label: shape.label === '生命线' || shape.label === '参与者' ? shape.label : '文本',
  })

  props.graph.cleanSelection()
  props.graph.select(node)
}
</script>

<template>
  <div class="shape-panel">
    <h4>图形库</h4>
    <div class="shape-panel__list">
      <el-button
        v-for="shape in shapes"
        :key="shape.id"
        size="small"
        class="shape-panel__item"
        @click="addShape(shape)"
      >
        {{ shape.label }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.shape-panel {
  padding: 12px;
  border-right: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  width: 160px;
  flex-shrink: 0;
}

.shape-panel h4 {
  margin: 0 0 12px;
  font-size: 14px;
}

.shape-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shape-panel__item {
  width: 100%;
  margin: 0;
}
</style>
