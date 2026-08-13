import { Graph } from '@antv/x6'
import type { DiagramTemplate } from '../types'

const COLORS = {
  primary: '#5f95ff',
  primaryBg: '#eff4ff',
  stroke: '#d9d9d9',
  lifeline: '#888',
  text: '#262626',
  textSoft: '#595959',
  edge: '#333',
  edgeDash: '#777',
  noteFill: '#fffbe6',
  noteStroke: '#faad14',
  activationFill: '#bfd4ff',
  activationStroke: '#4080ff',
}

export function registerSequenceShapes() {
  Graph.registerNode(
    'participant',
    {
      inherit: 'rect',
      width: 120,
      height: 36,
      attrs: {
        body: {
          fill: COLORS.primaryBg,
          stroke: COLORS.primary,
          strokeWidth: 1.5,
          rx: 4,
          ry: 4,
        },
        label: { fontSize: 13, fill: COLORS.text },
      },
    },
    true,
  )

  Graph.registerNode(
    'activation',
    {
      inherit: 'rect',
      width: 16,
      height: 40,
      attrs: {
        body: {
          fill: '#a8c8ff',
          stroke: '#3370ff',
          strokeWidth: 1,
        },
      },
    },
    true,
  )

  Graph.registerNode(
    'note',
    {
      inherit: 'rect',
      width: 120,
      height: 60,
      attrs: {
        body: {
          fill: COLORS.noteFill,
          stroke: COLORS.noteStroke,
          strokeWidth: 1,
        },
        label: { fontSize: 12, fill: COLORS.textSoft },
      },
    },
    true,
  )
}

export function addLifelineEdge(graph: Graph, x: number, y: number, height: number) {
  graph.addEdge({
    shape: 'edge',
    source: { x, y },
    target: { x, y: y + height },
    attrs: {
      line: {
        stroke: COLORS.lifeline,
        strokeWidth: 1.5,
        targetMarker: null,
        sourceMarker: null,
      },
    },
    zIndex: -1,
  })
}

function makeMessageEdge(
  source: { x: number; y: number },
  target: { x: number; y: number },
  label: string,
  type: 'sync' | 'async' | 'return' = 'sync',
) {
  const isReturn = type === 'return'
  const stroke = isReturn ? COLORS.edgeDash : COLORS.edge
  const dasharray = isReturn ? '5 3' : undefined
  return {
    source,
    target,
    labels: label
      ? [
        {
          attrs: { label: { text: label, fill: COLORS.text, fontSize: 12 } },
        },
      ]
      : [],
    attrs: {
      line: {
        stroke,
        strokeWidth: 1.5,
        strokeDasharray: dasharray,
        targetMarker: { name: 'classic', size: 7 },
      },
    },
    router: { name: 'orth' },
  }
}

export const sequenceTemplate: DiagramTemplate = {
  type: 'sequence',
  label: '时序图',
  shapes: [
    { id: 'participant', label: '参与者', type: 'participant', width: 120, height: 36 },
    { id: 'lifeline', label: '生命线', type: 'lifeline' },
    { id: 'activation', label: '激活框', type: 'activation', width: 16, height: 40 },
    { id: 'note', label: '注释', type: 'note', width: 120, height: 60 },
    { id: 'sync-message', label: '同步消息', type: 'sync-message', kind: 'edge' },
    { id: 'async-message', label: '异步消息', type: 'async-message', kind: 'edge' },
    { id: 'return-message', label: '返回消息', type: 'return-message', kind: 'edge' },
  ],
  initGraph(graph) {
    const actors = ['用户', '前端', '后端', '数据库']
    const startX = 180
    const gap = 220
    const lifelineTop = 76
    const lifelineHeight = 460

    actors.forEach((name, index) => {
      const cx = startX + index * gap
      graph.addNode({
        shape: 'participant',
        x: cx - 60,
        y: 40,
        label: name,
      })
      addLifelineEdge(graph, cx, lifelineTop, lifelineHeight)
    })

    const y0 = 170
    graph.addEdge(makeMessageEdge({ x: startX, y: y0 }, { x: startX + gap, y: y0 }, '登录请求', 'sync'))
    graph.addEdge(makeMessageEdge({ x: startX + gap, y: y0 + 55 }, { x: startX + gap * 2, y: y0 + 55 }, '验证用户', 'sync'))
    graph.addEdge(makeMessageEdge({ x: startX + gap * 2, y: y0 + 110 }, { x: startX + gap * 3, y: y0 + 110 }, '查询用户', 'sync'))
    graph.addEdge(makeMessageEdge({ x: startX + gap * 3, y: y0 + 165 }, { x: startX + gap * 2, y: y0 + 165 }, '用户数据', 'return'))
    graph.addEdge(makeMessageEdge({ x: startX + gap * 2, y: y0 + 220 }, { x: startX + gap, y: y0 + 220 }, 'Token', 'return'))
    graph.addEdge(makeMessageEdge({ x: startX + gap, y: y0 + 275 }, { x: startX, y: y0 + 275 }, '登录成功', 'return'))

    graph.addNode({ shape: 'activation', x: startX + gap - 8, y: y0 - 5, height: 100 })
    graph.addNode({ shape: 'activation', x: startX + gap * 2 - 8, y: y0 + 50, height: 110 })
    graph.addNode({ shape: 'activation', x: startX + gap * 3 - 8, y: y0 + 105, height: 70 })

    const loopY = y0 + 320
    graph.addNode({
      shape: 'rect',
      x: startX - 60,
      y: loopY,
      width: gap * 3 + 120,
      height: 130,
      label: '',
      attrs: {
        body: {
          fill: 'none',
          stroke: COLORS.primary,
          strokeWidth: 1.5,
        },
      },
      zIndex: 5,
    })
    graph.addNode({
      shape: 'rect',
      x: startX - 60,
      y: loopY,
      width: 52,
      height: 22,
      label: 'loop',
      attrs: {
        body: { fill: COLORS.primary, stroke: COLORS.primary },
        label: { fill: '#fff', fontSize: 11, fontWeight: '600' },
      },
      zIndex: 10,
    })
    graph.addNode({
      shape: 'rect',
      x: startX,
      y: loopY + 2,
      width: 140,
      height: 22,
      label: '[密码错误时重试]',
      attrs: {
        body: { fill: 'transparent', stroke: 'none' },
        label: { fill: '#444', fontSize: 12, textAnchor: 'start' },
      },
      zIndex: 9,
    })

    graph.addNode({
      shape: 'note',
      x: startX + gap * 3 + 50,
      y: y0 - 10,
      width: 110,
      height: 48,
      label: '密码加密传输',
    })
  },
}

export function addSequenceMessage(graph: Graph, type: 'sync' | 'async' | 'return' = 'sync') {
  const y = 200 + Math.random() * 80
  graph.addEdge(makeMessageEdge({ x: 220, y }, { x: 420, y }, '消息', type))
}

export function addParticipant(graph: Graph) {
  const x = 200 + Math.random() * 100
  graph.addNode({ shape: 'participant', x, y: 40, label: '参与者' })
  addLifelineEdge(graph, x + 60, 76, 400)
}

export function addLifeline(graph: Graph) {
  addLifelineEdge(graph, 300 + Math.random() * 100, 100, 350)
}

export function addActivation(graph: Graph) {
  graph.addNode({ shape: 'activation', x: 290, y: 180, height: 70 })
}

export function addNote(graph: Graph) {
  graph.addNode({ shape: 'note', x: 220, y: 220, width: 120, height: 60, label: '注释' })
}
