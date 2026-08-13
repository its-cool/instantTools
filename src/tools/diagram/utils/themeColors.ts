import type { Graph } from '@antv/x6'

export function getCssVar(name: string, fallback = '#ffffff'): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return val || fallback
}

export function applyGraphTheme(graph: Graph) {
  const isDark = document.documentElement.classList.contains('dark')
  const bg = isDark ? '#1e1e1f' : '#ffffff'
  graph.drawBackground({ color: bg })
}

export function observeThemeChange(callback: () => void): () => void {
  const observer = new MutationObserver(() => callback())
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}
