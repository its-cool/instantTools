<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Brush,
  DataAnalysis,
  Document,
  Grid,
  Location,
  Picture,
} from '@element-plus/icons-vue'
import { getCategories, getTools, getToolById } from '@/core/registry'
import { CATEGORY_LABELS } from '@/core/types'
import { useAppStore } from '@/stores/app'
import FlickeringGrid from '@/shared/components/FlickeringGrid.vue'
import CardContainer from '@/shared/components/card3d/CardContainer.vue'
import CardBody from '@/shared/components/card3d/CardBody.vue'
import CardItem from '@/shared/components/card3d/CardItem.vue'

const router = useRouter()
const appStore = useAppStore()

const categoryIcons: Record<string, typeof Grid> = {
  diagram: Picture,
  color: Brush,
  formatter: Document,
  barcode: DataAnalysis,
  coordinate: Location,
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

// 背景网格颜色随主题切换
const gridColor = computed(() =>
  appStore.isDark ? '#ffffff' : '#334155',
)

function openTool(route: string) {
  router.push(route)
}
</script>

<template>
  <div class="home">
    <div class="home__bg">
      <FlickeringGrid :color="gridColor" :max-opacity="0.15" />
    </div>

    <div class="home__content">
      <section class="home__hero">
        <h1>Web 即时工具平台</h1>
        <p>绘图、配色、格式转换、条码生成 — 全部在浏览器本地运行，无需后端</p>
      </section>

      <section v-if="recentToolList.length" class="home__section">
        <h2>最近使用</h2>
        <div class="home__cards">
          <CardContainer v-for="tool in recentToolList" :key="tool.id" container-class="home__card3d-wrap">
            <CardBody>
              <CardItem :translate-z="40" class="home__card" @click="openTool(tool.route)">
                <h3>{{ tool.name }}</h3>
                <p>{{ tool.description }}</p>
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>
      </section>

      <section v-for="category in categories" :key="category.id" class="home__section">
        <div class="home__section-title">
          <el-icon>
            <component :is="category.icon" />
          </el-icon>
          <h2>{{ category.label }}</h2>
        </div>
        <div class="home__cards">
          <CardContainer v-for="tool in category.tools" :key="tool.id" container-class="home__card3d-wrap">
            <CardBody>
              <CardItem :translate-z="40" class="home__card" @click="openTool(tool.route)">
                <h3>{{ tool.name }}</h3>
                <p>{{ tool.description }}</p>
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px;
}

.home__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.home__content {
  position: relative;
  z-index: 1;
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
  gap: 12px;
  align-items: stretch;
}

/* 让 3D 卡片容器填满网格单元，保证卡片宽高对齐 */
.home__card3d-wrap {
  width: 100%;
  height: 100%;
  padding: 4px;
}

:deep(.card3d-perspective) {
  width: 100%;
  height: 100%;
  padding: 4px;
}

:deep(.card3d-container) {
  width: 100%;
  height: 100%;
}

:deep(.card3d-body) {
  width: 100%;
  height: 100%;
}

.home__card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
  user-select: none;
}

.home__card:hover {
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.15);
  border-color: var(--el-color-primary-light-5);
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
  flex: 1 1 auto;
}
</style>
