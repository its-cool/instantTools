import { Graph } from '@antv/x6'
import type { DiagramTemplate } from '../types'

Graph.registerNode('actor', {
  inherit: 'rect',
  width: 60,
  height: 80,
  markup: [
    { tagName: 'circle', selector: 'head' },
    { tagName: 'rect', selector: 'body' },
    { tagName: 'line', selector: 'leg-l' },
    { tagName: 'line', selector: 'leg-r' },
    { tagName: 'text', selector: 'label' },
  ],
  attrs: {
    head: {
      cx: 30,
      cy: 16,
      r: 12,
      fill: 'none',
      stroke: '#333',
      strokeWidth: 2,
    },
    body: {
      x: 18,
      y: 28,
      width: 24,
      height: 32,
      fill: 'none',
      stroke: '#333',
      strokeWidth: 2,
    },
    'leg-l': { x1: 22, y1: 60, x2: 12, y2: 78, stroke: '#333', strokeWidth: 2 },
    'leg-r': { x1: 38, y1: 60, x2: 48, y2: 78, stroke: '#333', strokeWidth: 2 },
    label: {
      refX: '50%',
      refY: '100%',
      refY2: 8,
      textAnchor: 'middle',
      fontSize: 13,
      fill: '#333',
    },
  },
})

Graph.registerNode('usecase', {
  inherit: 'ellipse',
  width: 120,
  height: 60,
  attrs: {
    body: {
      fill: '#FFF7E6',
      stroke: '#FA8C16',
      strokeWidth: 2,
    },
    label: {
      fontSize: 13,
      fill: '#333',
    },
  },
})

Graph.registerNode('system-boundary', {
  inherit: 'rect',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: '#999',
      strokeWidth: 1,
      strokeDasharray: '8 4',
    },
    label: {
      refX: 12,
      refY: 16,
      textAnchor: 'start',
      fontSize: 14,
      fill: '#666',
    },
  },
})

export const usecaseTemplate: DiagramTemplate = {
  type: 'usecase',
  label: '用例图',
  shapes: [
    { id: 'actor', label: '参与者', type: 'actor', width: 60, height: 80 },
    { id: 'usecase', label: '用例', type: 'usecase', width: 120, height: 60 },
    { id: 'system-boundary', label: '系统边界', type: 'system-boundary', width: 400, height: 300 },
  ],
  initGraph(graph) {
    graph.addNode({
      shape: 'system-boundary',
      x: 180,
      y: 60,
      width: 420,
      height: 320,
      label: '系统',
    })

    graph.addNode({
      shape: 'actor',
      x: 80,
      y: 160,
      label: '用户',
    })

    graph.addNode({
      shape: 'usecase',
      x: 280,
      y: 120,
      label: '登录',
    })

    graph.addNode({
      shape: 'usecase',
      x: 280,
      y: 220,
      label: '查看数据',
    })

    graph.addEdge({
      source: { x: 140, y: 200 },
      target: { x: 280, y: 150 },
      attrs: {
        line: { stroke: '#666', strokeWidth: 1.5, targetMarker: null },
      },
    })

    graph.addEdge({
      source: { x: 140, y: 200 },
      target: { x: 280, y: 250 },
      attrs: {
        line: { stroke: '#666', strokeWidth: 1.5, targetMarker: null },
      },
    })

    graph.addEdge({
      source: { x: 340, y: 180 },
      target: { x: 340, y: 220 },
      labels: [{ attrs: { label: { text: '<<include>>' } } }],
      attrs: {
        line: {
          stroke: '#999',
          strokeWidth: 1,
          strokeDasharray: '4 2',
          targetMarker: { name: 'classic', size: 6 },
        },
      },
    })
  },
}

export function addActor(graph: Graph) {
  graph.addNode({
    shape: 'actor',
    x: 100,
    y: 200,
    label: '参与者',
  })
}

export function addUseCase(graph: Graph) {
  graph.addNode({
    shape: 'usecase',
    x: 300,
    y: 200,
    label: '用例',
  })
}
