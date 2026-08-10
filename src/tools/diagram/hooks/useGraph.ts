import type { Graph } from '@antv/x6'
import { Graph as X6Graph, Shape } from '@antv/x6'
import {
  Clipboard,
  Export,
  History,
  Keyboard,
  MiniMap,
  Selection,
  Snapline,
} from '@antv/x6'
import type { Ref } from 'vue'
import type { DiagramType } from '../types'

export interface UseGraphOptions {
  containerRef: Ref<HTMLElement | undefined>
  minimapRef?: Ref<HTMLElement | undefined>
  diagramType: DiagramType
}

export function createGraphInstance(options: UseGraphOptions): Graph {
  const container = options.containerRef.value
  if (!container) {
    throw new Error('Graph container not ready')
  }

  const graph = new X6Graph({
    container,
    autoResize: true,
    grid: {
      size: 10,
      visible: true,
    },
    panning: {
      enabled: true,
      eventTypes: ['leftMouseDown'],
    },
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta'],
      factor: 1.1,
      maxScale: 3,
      minScale: 0.3,
    },
    connecting: {
      router: 'orth',
      connector: { name: 'rounded' },
      connectionPoint: 'boundary',
      allowBlank: false,
      snap: { radius: 24 },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#5F95FF',
              strokeWidth: 2,
              targetMarker: { name: 'block', width: 10, height: 6 },
            },
          },
          zIndex: 0,
        })
      },
    },
  })

  graph.use(
    new Selection({
      enabled: true,
      multiple: true,
      rubberband: true,
      showNodeSelectionBox: true,
      showEdgeSelectionBox: true,
    }),
  )
  graph.use(new Snapline({ enabled: true }))
  graph.use(new History({ enabled: true }))
  graph.use(new Keyboard({ enabled: true }))
  graph.use(new Clipboard({ enabled: true }))
  graph.use(new Export())

  if (options.minimapRef?.value) {
    graph.use(
      new MiniMap({
        container: options.minimapRef.value,
        width: 180,
        height: 120,
        padding: 8,
      }),
    )
  }

  bindShortcuts(graph, options.diagramType)

  return graph
}

function bindShortcuts(graph: Graph, diagramType?: DiagramType) {
  graph.bindKey(['meta+z', 'ctrl+z'], () => {
    if (graph.canUndo()) graph.undo()
  })
  graph.bindKey(['meta+shift+z', 'ctrl+shift+z', 'meta+y', 'ctrl+y'], () => {
    if (graph.canRedo()) graph.redo()
  })
  graph.bindKey(['backspace', 'delete'], () => {
    if (diagramType === 'mindmap') return
    const cells = graph.getSelectedCells()
    if (cells.length) graph.removeCells(cells)
  })
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells()
    if (cells.length) graph.copy(cells)
  })
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    if (!graph.isClipboardEmpty()) {
      const cells = graph.paste({ offset: 32 })
      graph.cleanSelection()
      graph.select(cells)
    }
  })
}

export function zoomGraph(graph: Graph, factor: number) {
  graph.zoom(factor, { absolute: false })
}

export function fitGraph(graph: Graph) {
  graph.zoomToFit({ padding: 40, maxScale: 1.2 })
}

export function centerGraph(graph: Graph) {
  graph.centerContent()
}
