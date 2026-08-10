import { mindmapTemplate } from './mindmap'
import { sequenceTemplate } from './sequence'
import { usecaseTemplate } from './usecase'
import type { DiagramTemplate, DiagramType } from '../types'

export const diagramTemplates: Record<DiagramType, DiagramTemplate> = {
  mindmap: mindmapTemplate,
  sequence: sequenceTemplate,
  usecase: usecaseTemplate,
}

export function getDiagramTemplate(type: DiagramType): DiagramTemplate {
  return diagramTemplates[type]
}

export * from './mindmap'
export * from './sequence'
export * from './usecase'
