import { Graph } from '@antv/x6'
import type { Cell, Node } from '@antv/x6'
import type { DiagramTemplate } from '../types'

const MINDMAP_SHAPE = 'mindmap-node'
const LIST_SHAPE = 'mindmap-list'
const H_GAP = 80
const V_GAP = 24
const PADDING = 60

const LEVEL_COLORS = [
  { fill: { type: 'linearGradient', stops: [{ offset: 0, color: '#4F8EFC' }, { offset: 1, color: '#1F6FEB' }] }, stroke: '#1558C0', color: '#ffffff', fontSize: 16 },
  { fill: '#EFF4FF', stroke: '#5F95FF', color: '#262626', fontSize: 14 },
  { fill: '#F6FFED', stroke: '#73D13D', color: '#262626', fontSize: 13 },
  { fill: '#FFF7E6', stroke: '#FFA940', color: '#262626', fontSize: 13 },
]

function getStyle(level: number) {
  return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)]
}

const PORTS = [
  { id: 'top', group: 'top' },
  { id: 'right', group: 'right' },
  { id: 'bottom', group: 'bottom' },
  { id: 'left', group: 'left' },
]

const portAttrs = { circle: { r: 0, magnet: true, stroke: 'transparent', fill: 'transparent' } }

Graph.registerNode(MINDMAP_SHAPE, {
  inherit: 'rect',
  width: 120,
  height: 40,
  markup: [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'text', selector: 'label' },
    {
      tagName: 'g',
      selector: 'badge',
      children: [
        { tagName: 'circle', selector: 'badgeBody' },
        { tagName: 'text', selector: 'badgeText' },
      ],
    },
  ],
  attrs: {
    body: {
      strokeWidth: 1.5,
      stroke: '#5F95FF',
      fill: '#EFF4FF',
      rx: 8,
      ry: 8,
    },
    label: {
      fontSize: 14,
      fill: '#262626',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      refX: '50%',
      refY: '50%',
    },
    badge: {
      refX: '100%',
      refY: 0,
      display: 'none',
      event: 'node:collapse',
      cursor: 'pointer',
    },
    badgeBody: {
      r: 10,
      fill: '#909399',
      stroke: '#fff',
      strokeWidth: 1,
      refX: -2,
      refY: 2,
    },
    badgeText: {
      fontSize: 10,
      fill: '#fff',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      refX: -2,
      refY: 2,
    },
  },
  ports: {
    groups: {
      top: { position: 'top', attrs: portAttrs },
      right: { position: 'right', attrs: portAttrs },
      bottom: { position: 'bottom', attrs: portAttrs },
      left: { position: 'left', attrs: portAttrs },
    },
    items: PORTS,
  },
})

Graph.registerNode(LIST_SHAPE, {
  inherit: 'rect',
  width: 140,
  height: 80,
  markup: [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'text', selector: 'label' },
  ],
  attrs: {
    body: {
      strokeWidth: 1,
      stroke: '#D9D9D9',
      fill: '#FAFAFA',
      rx: 4,
      ry: 4,
    },
    label: {
      fontSize: 13,
      fill: '#595959',
      textAnchor: 'start',
      textVerticalAnchor: 'top',
      refX: 12,
      refY: 10,
      lineHeight: 20,
    },
  },
  ports: {
    groups: {
      top: { position: 'top', attrs: portAttrs },
      right: { position: 'right', attrs: portAttrs },
      bottom: { position: 'bottom', attrs: portAttrs },
      left: { position: 'left', attrs: portAttrs },
    },
    items: PORTS,
  },
})

export function isMindmapNode(cell: Cell): cell is Node {
  return cell.isNode() && (cell.shape === MINDMAP_SHAPE || cell.shape === LIST_SHAPE)
}

export function getMindmapRoot(graph: Graph): Node | null {
  const nodes = graph.getNodes().filter(isMindmapNode)
  for (const node of nodes) {
    const incoming = graph.getIncomingEdges(node) ?? []
    if (incoming.length === 0) return node
  }
  return nodes[0] ?? null
}

export function getMindmapChildren(graph: Graph, node: Node): Node[] {
  const edges = graph.getOutgoingEdges(node)
  if (!edges) return []
  return edges
    .map((edge) => edge.getTargetCell())
    .filter((cell): cell is Node => Boolean(cell?.isNode()))
}

export function getMindmapParent(graph: Graph, nodeId: string): Node | null {
  const edges = graph.getIncomingEdges(nodeId)
  const edge = edges?.[0]
  const source = edge?.getSourceCell()
  return source?.isNode() ? source : null
}

function getLevel(node: Node): number {
  return Number(node.getData()?.level ?? 0)
}

function isCollapsed(node: Node): boolean {
  return Boolean(node.getData()?.collapsed)
}

function fitSize(node: Node) {
  if (node.shape === LIST_SHAPE) {
    fitListSize(node)
    return
  }
  const label = (node.attr('label/text') as string) ?? ''
  const style = getStyle(getLevel(node))
  const width = Math.min(280, Math.max(72, label.length * style.fontSize * 0.65 + 32))
  const height = Math.max(36, style.fontSize + 20)
  node.resize(width, height)
}

function fitListSize(node: Node) {
  const raw = (node.attr('label/text') as string) ?? ''
  const lines = raw.split('\n')
  const maxLen = Math.max(...lines.map((l) => l.length), 1)
  const fontSize = 13
  const lineHeight = 20
  const width = Math.min(280, Math.max(100, maxLen * fontSize * 0.65 + 28))
  const height = Math.max(40, lines.length * lineHeight + 16)
  node.resize(width, height)
}

function applyStyle(node: Node, level: number) {
  const style = getStyle(level)
  node.setData({ ...node.getData(), level })
  node.setAttrs({
    body: { fill: style.fill, stroke: style.stroke },
    label: { fill: style.color, fontSize: style.fontSize },
  })
  fitSize(node)
}

function countDescendants(graph: Graph, node: Node): number {
  const children = getMindmapChildren(graph, node)
  return children.reduce((sum, child) => sum + 1 + countDescendants(graph, child), 0)
}

function refreshBadge(graph: Graph, node: Node) {
  const children = getMindmapChildren(graph, node)
  if (!children.length) {
    node.setAttrByPath('badge/display', 'none')
    return
  }
  const collapsed = isCollapsed(node)
  node.setAttrByPath('badge/display', 'block')
  node.setAttrByPath('badgeBody/fill', collapsed ? '#1F6FEB' : '#909399')
  node.setAttrByPath('badgeText/text', collapsed ? `+${countDescendants(graph, node)}` : '−')
}

function setSubtreeVisible(graph: Graph, node: Node, visible: boolean) {
  getMindmapChildren(graph, node).forEach((child) => {
    child.setVisible(visible)
    const edges = graph.getConnectedEdges(child) ?? []
    edges.forEach((edge) => edge.setVisible(visible))
    if (visible || !isCollapsed(child)) {
      setSubtreeVisible(graph, child, visible)
    }
  })
}

function measureSubtree(graph: Graph, node: Node): number {
  const children = getMindmapChildren(graph, node).filter((child) => child.isVisible())
  if (!children.length) return node.getSize().height
  return children.reduce(
    (sum, child, index) => sum + measureSubtree(graph, child) + (index > 0 ? V_GAP : 0),
    0,
  )
}

function layoutSubtree(graph: Graph, node: Node, x: number, y: number) {
  const children = getMindmapChildren(graph, node).filter((child) => child.isVisible())
  const subtreeHeight = measureSubtree(graph, node)
  const nodeHeight = node.getSize().height
  node.setPosition(x, y + (subtreeHeight - nodeHeight) / 2)

  if (!children.length) return

  const blockHeight = children.reduce(
    (sum, child, index) => sum + measureSubtree(graph, child) + (index > 0 ? V_GAP : 0),
    0,
  )
  let childY = y + (subtreeHeight - blockHeight) / 2
  const childX = x + node.getSize().width + H_GAP

  children.forEach((child, index) => {
    if (index > 0) childY += V_GAP
    layoutSubtree(graph, child, childX, childY)
    childY += measureSubtree(graph, child)
  })
}

export function relayoutMindmap(graph: Graph) {
  const root = getMindmapRoot(graph)
  if (!root) return

  graph.getNodes().filter(isMindmapNode).forEach(fitSize)

  layoutSubtree(graph, root, PADDING, PADDING)

  const nodes = graph.getNodes().filter(isMindmapNode)
  if (nodes.length) {
    const minY = Math.min(...nodes.map((node) => node.getPosition().y))
    nodes.forEach((node) => {
      const pos = node.getPosition()
      node.setPosition(pos.x, pos.y - minY + PADDING)
    })
  }

  refreshAllBadges(graph)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      graph.zoomToFit({ padding: PADDING, maxScale: 1 })
      graph.centerContent()
    })
  })
}

function refreshAllBadges(graph: Graph) {
  graph.getNodes().filter(isMindmapNode).forEach((node) => refreshBadge(graph, node))
}

export function addMindmapChild(graph: Graph, parentId: string): Node | null {
  const parent = graph.getCellById(parentId)
  if (!parent?.isNode()) return null

  if (isCollapsed(parent)) {
    parent.setData({ ...parent.getData(), collapsed: false })
    setSubtreeVisible(graph, parent, true)
  }

  const child = graph.addNode({
    shape: MINDMAP_SHAPE,
    label: '分支主题',
    ports: PORTS,
    data: { level: getLevel(parent) + 1, collapsed: false },
  })
  applyStyle(child, getLevel(parent) + 1)

  graph.addEdge({
    source: { cell: parent.id },
    target: { cell: child.id },
    router: { name: 'manhattan', args: { padding: 10 } },
    connector: { name: 'rounded' },
    attrs: { line: { stroke: '#A2B1C3', strokeWidth: 2, targetMarker: null } },
  })

  relayoutMindmap(graph)
  return child
}

export function addMindmapList(graph: Graph, parentId: string): Node | null {
  const parent = graph.getCellById(parentId)
  if (!parent?.isNode()) return null

  if (isCollapsed(parent)) {
    parent.setData({ ...parent.getData(), collapsed: false })
    setSubtreeVisible(graph, parent, true)
  }

  const list = graph.addNode({
    shape: LIST_SHAPE,
    label: '列表项 1\n列表项 2\n列表项 3',
    ports: PORTS,
    data: { level: getLevel(parent) + 1, collapsed: false, isList: true },
  })
  list.setAttrByPath('label/text', '• 列表项 1\n• 列表项 2\n• 列表项 3')
  fitListSize(list)
  attachEditor(list)

  graph.addEdge({
    source: { cell: parent.id },
    target: { cell: list.id },
    router: { name: 'manhattan', args: { padding: 10 } },
    connector: { name: 'rounded' },
    attrs: { line: { stroke: '#A2B1C3', strokeWidth: 2, targetMarker: null } },
  })

  relayoutMindmap(graph)
  return list
}

export function addMindmapSibling(graph: Graph, nodeId: string): Node | null {
  const node = graph.getCellById(nodeId)
  if (!node?.isNode()) return null

  const parent = getMindmapParent(graph, nodeId)
  if (!parent) return null

  const sibling = graph.addNode({
    shape: MINDMAP_SHAPE,
    label: '同级主题',
    ports: PORTS,
    data: { level: getLevel(node), collapsed: false },
  })
  applyStyle(sibling, getLevel(node))

  graph.addEdge({
    source: { cell: parent.id },
    target: { cell: sibling.id },
    router: { name: 'manhattan', args: { padding: 10 } },
    connector: { name: 'rounded' },
    attrs: { line: { stroke: '#A2B1C3', strokeWidth: 2, targetMarker: null } },
  })

  relayoutMindmap(graph)
  return sibling
}

export function deleteMindmapNode(graph: Graph, nodeId: string): boolean {
  const root = getMindmapRoot(graph)
  if (!root || root.id === nodeId) return false

  const node = graph.getCellById(nodeId)
  if (!node?.isNode()) return false

  const toRemove: Node[] = []
  const collect = (current: Node) => {
    toRemove.push(current)
    getMindmapChildren(graph, current).forEach(collect)
  }
  collect(node)
  graph.removeCells(toRemove)
  relayoutMindmap(graph)
  return true
}

export function toggleCollapse(graph: Graph, nodeId: string): boolean {
  const node = graph.getCellById(nodeId)
  if (!node?.isNode() || !getMindmapChildren(graph, node).length) return false

  const collapsed = !isCollapsed(node)
  node.setData({ ...node.getData(), collapsed })
  setSubtreeVisible(graph, node, !collapsed)
  relayoutMindmap(graph)
  return true
}

function createEditorTool() {
  return {
    name: 'node-editor',
    args: {
      event: 'dblclick',
      contentCell: 'body',
      attrs: {
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", Roboto, sans-serif',
        color: '#262626',
        backgroundColor: 'rgba(255,255,255,0.98)',
        border: '2px solid #1F6FEB',
        borderRadius: 8,
        outline: 'none',
        padding: '0 8px',
        textAlign: 'center',
      },
      getText: ({ cell }: { cell: Cell }) => {
        if (!cell.isNode()) return ''
        if (cell.shape === LIST_SHAPE) {
          const raw = (cell.attr('label/text') as string) ?? ''
          return raw.replace(/^• /gm, '')
        }
        return (cell.attr('label/text') as string) ?? ''
      },
      setText({ cell, value }: { cell: Cell; value: string | null }) {
        if (!cell.isNode()) return
        if (cell.shape === LIST_SHAPE) {
          const lines = (value || '').split('\n').filter((l) => l.trim())
          const text = lines.length ? lines.map((l) => `• ${l.trim()}`).join('\n') : '• 列表项'
          cell.setAttrByPath('label/text', text)
          cell.prop('label', text)
          fitListSize(cell)
        } else {
          const text = value?.trim() || '节点'
          cell.setAttrByPath('label/text', text)
          cell.prop('label', text)
          fitSize(cell)
        }
      },
    },
  }
}

export function attachEditor(node: Node) {
  node.removeTool('node-editor')
  node.addTools([createEditorTool()])
}

export function startEditing(graph: Graph, node: Node) {
  const view = graph.findViewByCell(node)
  const element = view?.container as HTMLElement | undefined
  element?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
}

export function restoreMindmap(graph: Graph) {
  const root = getMindmapRoot(graph)
  if (!root) return

  const walk = (node: Node, level: number) => {
    node.setData({ ...node.getData(), level })
    if (node.shape !== LIST_SHAPE) {
      applyStyle(node, level)
    } else {
      fitListSize(node)
    }
    attachEditor(node)
    getMindmapChildren(graph, node).forEach((child) => walk(child, level + 1))
  }
  walk(root, 0)
  relayoutMindmap(graph)
}

export function bindMindmapGraph(graph: Graph) {
  graph.bindKey('tab', (event) => {
    event.preventDefault()
    const selected = graph.getSelectedCells()[0]
    const target = selected && isMindmapNode(selected) ? selected : getMindmapRoot(graph)
    if (!target) return
    const child = addMindmapChild(graph, target.id)
    if (child) {
      graph.cleanSelection()
      graph.select(child)
      startEditing(graph, child)
    }
  })

  graph.bindKey('enter', (event) => {
    event.preventDefault()
    const selected = graph.getSelectedCells()[0]
    if (!selected || !isMindmapNode(selected)) return
    const sibling = addMindmapSibling(graph, selected.id)
    if (sibling) {
      graph.cleanSelection()
      graph.select(sibling)
      startEditing(graph, sibling)
    }
  })

  graph.bindKey('f2', (event) => {
    event.preventDefault()
    const selected = graph.getSelectedCells()[0]
    if (selected && isMindmapNode(selected)) startEditing(graph, selected)
  })

  graph.bindKey(['backspace', 'delete'], () => {
    const selected = graph.getSelectedCells()[0]
    if (selected && isMindmapNode(selected)) deleteMindmapNode(graph, selected.id)
  })

  graph.on('node:dblclick', ({ node }) => {
    if (isMindmapNode(node)) startEditing(graph, node)
  })

  graph.on('node:collapse', ({ node }: { node: Node }) => {
    if (isMindmapNode(node)) toggleCollapse(graph, node.id)
  })

  graph.on('node:change:attrs', ({ node, options }) => {
    if (!isMindmapNode(node)) return
    if (String(options?.propertyPath ?? '').includes('label')) {
      fitSize(node)
      relayoutMindmap(graph)
    }
  })
}

export function unbindMindmapGraph(graph: Graph) {
  graph.unbindKey('tab')
  graph.unbindKey('enter')
  graph.unbindKey('f2')
  graph.unbindKey(['backspace', 'delete'])
}

export const mindmapTemplate: DiagramTemplate = {
  type: 'mindmap',
  label: '思维导图',
  shapes: [{ id: MINDMAP_SHAPE, label: '主题节点', type: MINDMAP_SHAPE }],
  initGraph(graph) {
    const root = graph.addNode({
      shape: MINDMAP_SHAPE,
      label: '中心主题',
      ports: PORTS,
      data: { level: 0, collapsed: false },
      tools: [createEditorTool()],
    })
    applyStyle(root, 0)

    const child1 = graph.addNode({
      shape: MINDMAP_SHAPE,
      label: '分支主题 1',
      ports: PORTS,
      data: { level: 1, collapsed: false },
      tools: [createEditorTool()],
    })
    applyStyle(child1, 1)

    const child2 = graph.addNode({
      shape: MINDMAP_SHAPE,
      label: '分支主题 2',
      ports: PORTS,
      data: { level: 1, collapsed: false },
      tools: [createEditorTool()],
    })
    applyStyle(child2, 1)

    const grandchild = graph.addNode({
      shape: MINDMAP_SHAPE,
      label: '子主题',
      ports: PORTS,
      data: { level: 2, collapsed: false },
      tools: [createEditorTool()],
    })
    applyStyle(grandchild, 2)

    const edgeStyle = {
      router: { name: 'manhattan', args: { padding: 10 } },
      connector: { name: 'rounded' },
      attrs: { line: { stroke: '#A2B1C3', strokeWidth: 2, targetMarker: null } },
    }

    graph.addEdge({
      source: { cell: root.id },
      target: { cell: child1.id },
      ...edgeStyle,
    })
    graph.addEdge({
      source: { cell: root.id },
      target: { cell: child2.id },
      ...edgeStyle,
    })
    graph.addEdge({
      source: { cell: child1.id },
      target: { cell: grandchild.id },
      ...edgeStyle,
    })

    relayoutMindmap(graph)
    graph.cleanSelection()
    graph.select(root)
  },
}
