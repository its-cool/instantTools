<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Brush,
  DataAnalysis,
  Document,
  Expand,
  Fold,
  Grid,
  HomeFilled,
  Moon,
  Picture,
  Sunny,
} from '@element-plus/icons-vue'
import { getCategories, getToolsByCategory } from '@/core/registry'
import { CATEGORY_LABELS } from '@/core/types'
import { useAppStore } from '@/stores/app'
import ToolSearch from './ToolSearch.vue'

const route = useRoute()
const appStore = useAppStore()

import { ref } from 'vue'

const searchQuery = ref('')

const categoryIcons: Record<string, typeof Grid> = {
  diagram: Picture,
  color: Brush,
  formatter: Document,
  barcode: DataAnalysis,
}

const categories = computed(() => getCategories())

const activeMenu = computed(() => route.path)

function onToggleTheme(event: MouseEvent) {
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  appStore.toggleTheme({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
}
</script>

<template>
  <el-container class="app-layout">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="app-layout__aside">
      <div class="app-layout__logo">
        <span class="app-layout__logo-text">
          {{ appStore.sidebarCollapsed ? 'IT' : 'Instant Tools' }}
        </span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        router
        class="app-layout__menu"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <el-sub-menu
          v-for="category in categories"
          :key="category"
          :index="category"
        >
          <template #title>
            <el-icon>
              <component :is="categoryIcons[category] ?? Grid" />
            </el-icon>
            <span>{{ CATEGORY_LABELS[category] ?? category }}</span>
          </template>
          <el-menu-item
            v-for="tool in getToolsByCategory(category)"
            :key="tool.id"
            :index="tool.route"
          >
            {{ tool.name }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-layout__header">
        <div class="app-layout__header-inner">
          <div class="app-layout__header-left">
            <el-button text @click="appStore.toggleSidebar()">
              <el-icon>
                <Fold v-if="!appStore.sidebarCollapsed" />
                <Expand v-else />
              </el-icon>
            </el-button>
            <ToolSearch v-model="searchQuery" />
          </div>
          <div class="app-layout__header-right">
            <el-button text circle @click="onToggleTheme">
              <el-icon>
                <Moon v-if="!appStore.isDark" />
                <Sunny v-else />
              </el-icon>
            </el-button>
          </div>
        </div>
      </el-header>

      <el-main class="app-layout__main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-layout {
  height: 100vh;
}

.app-layout__aside {
  position: relative;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  transition: width 0.2s;
  overflow: hidden;
}

.app-layout__logo {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color);
  overflow: hidden;
  white-space: nowrap;
}

.app-layout__logo-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-layout__menu {
  border-right: none;
  background: transparent;
}

.app-layout__header {
  position: relative;
  height: 56px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.app-layout__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
}

.app-layout__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-layout__main {
  background: var(--el-fill-color-blank);
  overflow: auto;
}
</style>
