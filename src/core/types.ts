import type { Component } from 'vue'

export type ToolCategory = 'diagram' | 'color' | 'formatter' | 'barcode' | string

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  route: string
  component: () => Promise<{ default: Component }>
  keywords: string[]
}

export const CATEGORY_LABELS: Record<string, string> = {
  diagram: '绘图工具',
  color: '配色工具',
  formatter: '格式转换',
  barcode: '条码生成',
  coordinate: '坐标工具',
  text: '文本工具',
}
