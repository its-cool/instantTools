import { Graph } from '@antv/x6'
import type { DiagramTemplate } from '../types'

const COLORS = {
  primary: '#5f95ff',
  primaryBg: '#eff4ff',
  stroke: '#d9d9d9',
  actorStroke: '#555',
  text: '#262626',
  textSoft: '#595959',
  edge: '#555',
  edgeDash: '#888',
  noteFill: '#fffbe6',
  noteStroke: '#faad14',
  systemFill: '#eff4ff',
  systemStroke: '#5f95ff',
}

export function registerUsecaseShapes() {
  Graph.registerNode(
    'uc-actor',
    {
      inherit: 'circle',
      width: 30,
      height: 30,
      attrs: {
        body: { fill: '#fff', stroke: COLORS.actorStroke, strokeWidth: 1.5 },
        label: {
          text: '参与者',
          fontSize: 12,
          fill: COLORS.text,
          refY: '50%',
          refY2: 22,
          textVerticalAnchor: 'middle',
          textAnchor: 'middle',
        },
      },
    },
    true,
  )

  Graph.registerNode(
    'uc-usecase',
    {
      inherit: 'ellipse',
      width: 120,
      height: 50,
      attrs: {
        body: { fill: '#fff', stroke: COLORS.primary, strokeWidth: 1.5 },
        label: { fontSize: 12, fill: COLORS.text },
      },
    },
    true,
  )

  Graph.registerNode(
    'uc-system',
    {
      inherit: 'rect',
      width: 360,
      height: 240,
      attrs: {
        body: {
          fill: COLORS.systemFill,
          stroke: COLORS.systemStroke,
          strokeWidth: 1.5,
          rx: 6,
          ry: 6,
        },
        label: { text: '系统边界', fontSize: 13, fill: COLORS.textSoft, refX: 12, refY: 12, textAnchor: 'start' },
      },
    },
    true,
  )

  Graph.registerNode(
    'uc-note',
    {
      inherit: 'rect',
      width: 120,
      height: 60,
      attrs: {
        body: { fill: COLORS.noteFill, stroke: COLORS.noteStroke, strokeWidth: 1 },
        label: { fontSize: 12, fill: COLORS.textSoft },
      },
    },
    true,
  )
}

export const usecaseTemplate: DiagramTemplate = {
  type: 'usecase',
  label: '用例图',
  shapes: [
    { id: 'uc-actor', label: '参与者', type: 'uc-actor', width: 30, height: 30 },
    { id: 'uc-usecase', label: '用例', type: 'uc-usecase', width: 120, height: 50 },
    { id: 'uc-system', label: '系统边界', type: 'uc-system', width: 360, height: 240 },
    { id: 'uc-note', label: '注释', type: 'uc-note', width: 120, height: 60 },
    { id: 'include-rel', label: '«include»', type: 'include-rel', kind: 'edge' },
    { id: 'extend-rel', label: '«extend»', type: 'extend-rel', kind: 'edge' },
    { id: 'generalization', label: '泛化', type: 'generalization', kind: 'edge' },
  ],
  initGraph(graph) {
    graph.addNode({ shape: 'uc-actor', x: 70, y: 135, label: '用户' })
    graph.addNode({ shape: 'uc-actor', x: 555, y: 135, label: '管理员' })

    graph.addNode({
      shape: 'uc-system',
      x: 160,
      y: 40,
      width: 340,
      height: 280,
      label: '用户管理系统',
    })

    graph.addNode({ shape: 'uc-usecase', x: 270, y: 90, label: '登录' })
    graph.addNode({ shape: 'uc-usecase', x: 270, y: 160, label: '查看个人信息' })
    graph.addNode({ shape: 'uc-usecase', x: 270, y: 230, label: '修改密码' })
    graph.addNode({ shape: 'uc-usecase', x: 400, y: 260, label: '用户管理' })

    graph.addEdge({
      source: { x: 100, y: 150 },
      target: { x: 270, y: 115 },
      attrs: { line: { stroke: COLORS.edge, strokeWidth: 1.5, targetMarker: null } },
    })
    graph.addEdge({
      source: { x: 100, y: 150 },
      target: { x: 270, y: 185 },
      attrs: { line: { stroke: COLORS.edge, strokeWidth: 1.5, targetMarker: null } },
    })
    graph.addEdge({
      source: { x: 585, y: 150 },
      target: { x: 460, y: 285 },
      attrs: { line: { stroke: COLORS.edge, strokeWidth: 1.5, targetMarker: null } },
    })
    graph.addEdge({
      source: { x: 390, y: 255 },
      target: { x: 330, y: 200 },
      attrs: {
        line: {
          stroke: COLORS.edgeDash,
          strokeWidth: 1,
          strokeDasharray: '4 2',
          targetMarker: { name: 'classic', size: 6 },
        },
      },
      labels: [{ attrs: { label: { text: '«extend»', fontSize: 11, fill: COLORS.textSoft } } }],
    })
  },
}

export function addUsecaseActor(graph: Graph) {
  graph.addNode({ shape: 'uc-actor', x: 80, y: 100, label: '参与者' })
}

export function addUsecase(graph: Graph) {
  graph.addNode({ shape: 'uc-usecase', x: 200, y: 120, label: '用例' })
}

export function addSystemBoundary(graph: Graph) {
  graph.addNode({ shape: 'uc-system', x: 180, y: 80, label: '系统边界' })
}

export function addUsecaseNote(graph: Graph) {
  graph.addNode({ shape: 'uc-note', x: 250, y: 200, label: '注释' })
}

export const addUcActor = addUsecaseActor
export const addUcUsecase = addUsecase
export const addUcNote = addUsecaseNote
