import { XMLParser, XMLBuilder } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
})

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
})

export function jsonToXml(jsonStr: string): { output: string; error?: string } {
  try {
    const obj = JSON.parse(jsonStr)
    const wrapped = wrapRoot(obj)
    return { output: builder.build(wrapped) }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'JSON 解析失败',
    }
  }
}

export function xmlToJson(xmlStr: string): { output: string; error?: string } {
  try {
    const obj = parser.parse(xmlStr)
    const unwrapped = unwrapRoot(obj)
    return { output: JSON.stringify(unwrapped, null, 2) }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'XML 解析失败',
    }
  }
}

function wrapRoot(obj: unknown): Record<string, unknown> {
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    return obj as Record<string, unknown>
  }
  return { root: obj }
}

function unwrapRoot(obj: unknown): unknown {
  if (obj && typeof obj === 'object' && 'root' in (obj as object)) {
    const keys = Object.keys(obj as object)
    if (keys.length === 1) {
      return (obj as { root: unknown }).root
    }
  }
  return obj
}
