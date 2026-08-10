import type { ToolCategory, ToolDefinition } from './types'

const registry: ToolDefinition[] = []

export function registerTool(tool: ToolDefinition) {
  if (registry.some((item) => item.id === tool.id)) {
    return
  }
  registry.push(tool)
}

export function getTools(): ToolDefinition[] {
  return [...registry]
}

export function getToolById(id: string): ToolDefinition | undefined {
  return registry.find((item) => item.id === id)
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return registry.filter((item) => item.category === category)
}

export function getCategories(): ToolCategory[] {
  return [...new Set(registry.map((item) => item.category))]
}

export function searchTools(query: string): ToolDefinition[] {
  const keyword = query.trim().toLowerCase()
  if (!keyword) {
    return getTools()
  }
  return registry.filter((tool) => {
    const haystack = [
      tool.name,
      tool.description,
      tool.category,
      ...tool.keywords,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(keyword)
  })
}
