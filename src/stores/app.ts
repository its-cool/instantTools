import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToolDefinition } from '@/core/types'
import { getItem, setItem } from '@/shared/utils/storage'
import { withThemeTransition } from '@/shared/utils/themeTransition'

const RECENT_KEY = 'recent-tools'
const THEME_KEY = 'theme'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const isDark = ref(false)
  const recentTools = ref<string[]>([])

  async function init() {
    const savedTheme = await getItem<string>(THEME_KEY)
    isDark.value = savedTheme === 'dark'
    applyTheme()

    const savedRecent = await getItem<string[]>(RECENT_KEY)
    if (savedRecent?.length) {
      recentTools.value = savedRecent
    }
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleTheme(origin?: { x: number; y: number }) {
    withThemeTransition(() => {
      isDark.value = !isDark.value
      applyTheme()
      void setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
    }, origin)
  }

  function applyTheme() {
    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  function addRecentTool(tool: ToolDefinition) {
    const next = [tool.id, ...recentTools.value.filter((id) => id !== tool.id)].slice(
      0,
      8,
    )
    recentTools.value = next
    void setItem(RECENT_KEY, next)
  }

  return {
    sidebarCollapsed,
    isDark,
    recentTools,
    init,
    toggleSidebar,
    toggleTheme,
    addRecentTool,
  }
})
