import type { Graph } from '@antv/x6'
import { saveAs } from 'file-saver'

export function exportJson(graph: Graph, filename = 'diagram.json') {
  const data = graph.toJSON()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  saveAs(blob, filename)
}

export function importJson(graph: Graph, json: string) {
  const data = JSON.parse(json)
  graph.fromJSON(data)
}

export interface ImageExportOptions {
  format?: 'png' | 'jpeg'
  quality?: 'normal' | 'hd'
  watermark?: 'none' | 'system' | 'custom'
  watermarkText?: string
  filename?: string
  returnBlob?: boolean
}

function loadImage(dataUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUri
  })
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
) {
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#595959'
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(text, width - 16, height - 12)
  ctx.restore()
}

export async function exportImageWithOptions(
  graph: Graph,
  options: ImageExportOptions = {},
): Promise<Blob | void> {
  const {
    format = 'png',
    quality = 'hd',
    watermark = 'system',
    watermarkText = 'Instant Tools',
    filename = `diagram.${format === 'jpeg' ? 'jpg' : 'png'}`,
    returnBlob = false,
  } = options

  const pixelRatio = quality === 'hd' ? 2 : 1

  const dataUri = await graph.toPNGAsync({
    padding: 24,
    backgroundColor: '#ffffff',
    ratio: pixelRatio,
  })

  const image = await loadImage(dataUri)
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  ctx.drawImage(image, 0, 0)
  if (watermark === 'system') {
    drawWatermark(ctx, canvas.width, canvas.height, watermarkText)
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('blob failed'))),
      mimeType,
      format === 'jpeg' ? 0.92 : undefined,
    )
  })

  if (returnBlob) return blob
  saveAs(blob, filename)
}

export function exportPng(graph: Graph, filename = 'diagram.png') {
  void exportImageWithOptions(graph, { format: 'png', filename })
}

export function exportSvg(graph: Graph, filename = 'diagram.svg') {
  graph.exportSVG(filename, {
    preserveDimensions: true,
  })
}
