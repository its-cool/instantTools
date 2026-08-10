import { Graph } from '@antv/x6'
import type { DiagramTemplate } from '../types'

Graph.registerNode('lifeline', {
  inherit: 'rect',
  width: 2,
  height: 300,
  attrs: {
    body: {
      fill: 'transparent',
      stroke: '#888',
      strokeWidth: 1,
      strokeDasharray: '6 4',
    },
    label: {
      refY: -12,
      refX: '50%',
      textAnchor: 'middle',
      fontSize: 13,
      fill: '#333',
    },
  },
})

Graph.registerNode('activation', {
  inherit: 'rect',
  width: 12,
  height: 40,
  attrs: {
    body: {
      fill: '#EFF4FF',
      stroke: '#5F95FF',
      strokeWidth: 1,
    },
  },
})

export const sequenceTemplate: DiagramTemplate = {
  type: 'sequence',
  label: '时序图',
  shapes: [
    { id: 'lifeline', label: '生命线', type: 'lifeline', width: 2, height: 300 },
    { id: 'activation', label: '激活框', type: 'activation', width: 12, height: 40 },
    { id: 'rect', label: '注释', type: 'rect' },
  ],
  initGraph(graph) {
    const actors = ['用户', '系统', '数据库']
    const startX = 100
    const gap = 180

    actors.forEach((name, index) => {
      graph.addNode({
        shape: 'rect',
        x: startX + index * gap - 40,
        y: 40,
        width: 80,
        height: 36,
        label: name,
        attrs: {
          body: { fill: '#EFF4FF', stroke: '#5F95FF', rx: 4, ry: 4 },
        },
      })

      graph.addNode({
        shape: 'lifeline',
        x: startX + index * gap,
        y: 90,
        height: 320,
        label: '',
      })
    })

    graph.addEdge({
      source: { x: startX, y: 150 },
      target: { x: startX + gap, y: 150 },
      labels: [{ attrs: { label: { text: '请求' } } }],
      attrs: {
        line: {
          stroke: '#333',
          strokeWidth: 1.5,
          targetMarker: { name: 'classic', size: 8 },
        },
      },
    })

    graph.addEdge({
      source: { x: startX + gap, y: 200 },
      target: { x: startX + gap * 2, y: 200 },
      labels: [{ attrs: { label: { text: '查询' } } }],
      attrs: {
        line: {
          stroke: '#333',
          strokeWidth: 1.5,
          targetMarker: { name: 'classic', size: 8 },
        },
      },
    })

    graph.addEdge({
      source: { x: startX + gap, y: 260 },
      target: { x: startX, y: 260 },
      labels: [{ attrs: { label: { text: '响应' } } }],
      attrs: {
        line: {
          stroke: '#333',
          strokeWidth: 1.5,
          strokeDasharray: '6 4',
          targetMarker: { name: 'classic', size: 8 },
        },
      },
    })
  },
}

export function addSequenceMessage(graph: Graph) {
  graph.addEdge({
    attrs: {
      line: {
        stroke: '#333',
        strokeWidth: 1.5,
        targetMarker: { name: 'classic', size: 8 },
      },
    },
    labels: [{ attrs: { label: { text: '消息' } } }],
  })
}

export function addLifeline(graph: Graph) {
  graph.addNode({
    shape: 'lifeline',
    x: 200,
    y: 90,
    height: 300,
    label: '对象',
  })
}
