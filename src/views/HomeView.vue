<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Brush,
  DataAnalysis,
  Document,
  Grid,
  Picture,
} from '@element-plus/icons-vue'
import { getCategories, getTools, getToolById } from '@/core/registry'
import { CATEGORY_LABELS } from '@/core/types'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const categoryIcons: Record<string, typeof Grid> = {
  diagram: Picture,
  color: Brush,
  formatter: Document,
  barcode: DataAnalysis,
}

const categories = computed(() =>
  getCategories().map((category) => ({
    id: category,
    label: CATEGORY_LABELS[category] ?? category,
    icon: categoryIcons[category] ?? Grid,
    tools: getTools().filter((tool) => tool.category === category),
  })),
)

const recentToolList = computed(() =>
  appStore.recentTools
    .map((id) => getToolById(id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool)),
)

function openTool(route: string) {
  router.push(route)
}
</script>

<template>
  <div class="home">
    <section class="home__hero">
      <h1>Web 即时工具平台</h1>
      <p>绘图、配色、格式转换、条码生成 — 全部在浏览器本地运行，无需后端</p>
    </section>

    <section v-if="recentToolList.length" class="home__section">
      <h2>最近使用</h2>
      <div class="home__cards">
        <el-card
          v-for="tool in recentToolList"
          :key="tool.id"
          shadow="hover"
          class="home__card"
          @click="openTool(tool.route)"
        >
          <h3>{{ tool.name }}</h3>
          <p>{{ tool.description }}</p>
        </el-card>
      </div>
    </section>

    <section v-for="category in categories" :key="category.id" class="home__section">
      <div class="home__section-title">
        <el-icon><component :is="category.icon" /></el-icon>
        <h2>{{ category.label }}</h2>
      </div>
      <div class="home__cards">
        <el-card
          v-for="tool in category.tools"
          :key="tool.id"
          shadow="hover"
          class="home__card"
          @click="openTool(tool.route)"
        >
          <h3>{{ tool.name }}</h3>
          <p>{{ tool.description }}</p>
        </el-card>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px;
}

.home__hero {
  margin-bottom: 32px;
}

.home__hero h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.home__hero p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.home__section {
  margin-bottom: 32px;
}

.home__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.home__section-title h2 {
  margin: 0;
  font-size: 18px;
}

.home__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.home__card {
  cursor: pointer;
  transition: transform 0.2s;
}

.home__card:hover {
  transform: translateY(-2px);
}

.home__card h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.home__card p {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
