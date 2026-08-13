<script setup lang="ts">
import type { Graph } from '@antv/x6'
import type { DiagramType, ShapeDefinition } from '../types'
import { getMindmapRoot, relayoutMindmap } from '../mindmap'
import {
  addParticipant,
  addLifeline,
  addActivation,
  addNote,
  addSequenceMessage,
} from '../templates/sequence'
import {
  addUcActor,
  addUcUsecase,
  addUcNote,
} from '../templates/usecase'

const props = defineProps<{
  graph: Graph | null
  shapes: ShapeDefinition[]
  diagramType?: DiagramType
}>()

function addShape(shape: ShapeDefinition) {
  if (!props.graph) return

  if (props.diagramType === 'sequence') {
    switch (shape.type) {
      case 'participant':
        addParticipant(props.graph)
        return
      case 'lifeline':
        addLifeline(props.graph)
        return
      case 'activation':
        addActivation(props.graph)
        return
      case 'note':
        addNote(props.graph)
        return
      case 'sync-message':
        addSequenceMessage(props.graph, 'sync')
        return
      case 'async-message':
        addSequenceMessage(props.graph, 'async')
        return
      case 'return-message':
        addSequenceMessage(props.graph, 'return')
        return
    }
  }

  if (props.diagramType === 'usecase') {
    switch (shape.type) {
      case 'uc-actor':
        addUcActor(props.graph)
        return
      case 'uc-usecase':
        addUcUsecase(props.graph)
        return
      case 'uc-note':
        addUcNote(props.graph)
        return
    }
  }

  if (shape.kind === 'edge') {
    addEdge(shape)
    return
  }

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

  const nodeConfig: Record<string, unknown> = {
    shape: shape.type,
    x: 120 + Math.random() * 80,
    y: 120 + Math.random() * 80,
  }
  if (shape.width) nodeConfig.width = shape.width
  if (shape.height) nodeConfig.height = shape.height
  nodeConfig.label = shape.label

  const node = props.graph.addNode(nodeConfig)

  props.graph.cleanSelection()
  props.graph.select(node)
}

function addEdge(shape: ShapeDefinition) {
  if (!props.graph) return
  const baseX = 200 + Math.random() * 60
  const baseY = 200 + Math.random() * 60

  const edgeConfig: Record<
    string,
    { label: string; attrs: Record<string, unknown>; router?: { name: string } }
  > = {
    'sync-message': {
      label: '消息',
      attrs: { line: { stroke: '#555', strokeWidth: 1.5, targetMarker: { name: 'classic', size: 8 } } },
      router: { name: 'orth' },
    },
    'async-message': {
      label: '消息',
      attrs: { line: { stroke: '#555', strokeWidth: 1.5, targetMarker: { name: 'block', size: 8 } } },
      router: { name: 'orth' },
    },
    'return-message': {
      label: '返回',
      attrs: {
        line: {
          stroke: '#888',
          strokeWidth: 1.5,
          strokeDasharray: '6 4',
          targetMarker: { name: 'classic', size: 8 },
        },
      },
      router: { name: 'orth' },
    },
    'self-message': {
      label: '调用',
      attrs: { line: { stroke: '#555', strokeWidth: 1.5, targetMarker: { name: 'classic', size: 8 } } },
      router: { name: 'orth' },
    },
    'include-rel': {
      label: '«include»',
      attrs: {
        line: {
          stroke: '#888',
          strokeWidth: 1,
          strokeDasharray: '4 2',
          targetMarker: { name: 'classic', size: 6 },
        },
      },
    },
    'extend-rel': {
      label: '«extend»',
      attrs: {
        line: {
          stroke: '#888',
          strokeWidth: 1,
          strokeDasharray: '4 2',
          targetMarker: { name: 'classic', size: 6 },
        },
      },
    },
    'generalization': {
      label: '',
      attrs: { line: { stroke: '#555', strokeWidth: 1.5, targetMarker: { name: 'block', size: 10 } } },
    },
  }

  const config = edgeConfig[shape.type]
  if (!config) return

  const edge = props.graph.addEdge({
    source: { x: baseX, y: baseY },
    target: { x: baseX + 160, y: baseY },
    labels: config.label
      ? [{ attrs: { label: { text: config.label, fill: '#262626', fontSize: 12 } } }]
      : [],
    attrs: config.attrs,
    router: config.router,
  })

  props.graph.cleanSelection()
  props.graph.select(edge)
}
</script>

<template>
  <div class="shape-panel">
    <h4>图形库</h4>
    <div class="shape-panel__list">
      <el-button v-for="shape in shapes" :key="shape.id" size="small" class="shape-panel__item" @click="addShape(shape)">
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
