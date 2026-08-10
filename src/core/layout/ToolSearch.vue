<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { searchTools } from '@/core/registry'
import { CATEGORY_LABELS } from '@/core/types'

const query = defineModel<string>({ default: '' })
const router = useRouter()

const results = computed(() => searchTools(query.value).slice(0, 8))

function goTool(route: string) {
  router.push(route)
  query.value = ''
}
</script>

<template>
  <div class="tool-search">
    <el-input
      v-model="query"
      placeholder="搜索工具..."
      clearable
      :prefix-icon="Search"
    />
    <div v-if="query && results.length" class="tool-search__dropdown">
      <div
        v-for="tool in results"
        :key="tool.id"
        class="tool-search__item"
        @click="goTool(tool.route)"
      >
        <span class="tool-search__name">{{ tool.name }}</span>
        <span class="tool-search__category">{{
          CATEGORY_LABELS[tool.category] ?? tool.category
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-search {
  position: relative;
  width: 320px;
}

.tool-search__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  max-height: 320px;
  overflow-y: auto;
}

.tool-search__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
}

.tool-search__item:hover {
  background: var(--el-fill-color-light);
}

.tool-search__name {
  font-weight: 500;
}

.tool-search__category {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
