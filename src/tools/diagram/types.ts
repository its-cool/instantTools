import type { Graph } from '@antv/x6'

export type DiagramType = 'mindmap' | 'sequence' | 'usecase'

export interface DiagramTemplate {
  type: DiagramType
  label: string
  initGraph: (graph: Graph) => void
  shapes: ShapeDefinition[]
}

export interface ShapeDefinition {
  id: string
  label: string
  type: string
  width?: number
  height?: number
  attrs?: Record<string, unknown>
  kind?: 'node' | 'edge'
}

export function getStorageKey(type: DiagramType) {
  return `diagram-draft-${type}-v6`
}
