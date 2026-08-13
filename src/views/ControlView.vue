<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { useAnalyticsStore } from '@/stores/analytics'
import { getToolById } from '@/core/registry'
import { CATEGORY_LABELS } from '@/core/types'

const router = useRouter()
const analytics = useAnalyticsStore()

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const min = Math.floor(ms / 60000)
  const sec = Math.round((ms % 60000) / 1000)
  return `${min}m${sec}s`
}

function formatTime(ts: number): string {
  if (!ts) return '-'
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

const sortedToolStats = computed(() =>
  [...analytics.toolStats].sort((a, b) => b.totalVisits - a.totalVisits),
)

const sortedVisitorStats = computed(() =>
  [...analytics.visitorStats].sort((a, b) => b.lastVisit - a.lastVisit),
)

const sortedDailyStats = computed(() =>
  [...analytics.dailyStats].reverse().slice(0, 30),
)

// ---------- 每日访问趋势（echarts 折线图） ----------
const chartRef = ref<HTMLDivElement | null>(null)
// echarts 实例放到普通变量（非响应式），避免挂到 reactive/ref 上导致的异常
let chart: echarts.ECharts | null = null

const dailyTrend = computed(() =>
  sortedDailyStats.value.map((d) => ({
    date: d.date,
    visits: Object.values(d.visits).reduce((a, b) => a + b, 0),
  })),
)

function renderDailyChart() {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  const isDark = document.documentElement.classList.contains('dark')
  const axisColor = isDark ? '#888' : '#999'
  const splitColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
  const textColor = isDark ? '#ccc' : '#555'

  chart.setOption({
    grid: { left: 44, right: 24, top: 24, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = (params as Array<{ axisValue: string; value: number }>)[0]
        return p ? `${p.axisValue}<br/>访问次数：${p.value}` : ''
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dailyTrend.value.map((d) => d.date.slice(5)),
      axisLine: { lineStyle: { color: axisColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: '访问次数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: dailyTrend.value.map((d) => d.visits),
        lineStyle: { width: 2, color: '#409EFF' },
        itemStyle: { color: '#409EFF' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.15)' },
      },
    ],
  })
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  renderDailyChart()
  window.addEventListener('resize', handleResize)
})

watch(sortedDailyStats, () => {
  nextTick(() => renderDailyChart())
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})

function getToolName(toolId: string): string {
  return getToolById(toolId)?.name ?? toolId
}

function getToolCategory(toolId: string): string {
  const cat = getToolById(toolId)?.category
  return cat ? (CATEGORY_LABELS[cat] ?? cat) : '-'
}

function goHome() {
  router.push('/')
}

function clearData() {
  analytics.clearAll()
}

function switchSource(source: 'local' | 'remote') {
  analytics.setDataSource(source)
}

function refreshData() {
  void analytics.refreshRemote()
}

function maskSession(sid: string): string {
  if (sid.length <= 8) return sid
  return `${sid.slice(0, 4)}***${sid.slice(-4)}`
}
</script>

<template>
  <div class="control">
    <div class="control__header">
      <div>
        <h1>监控统计</h1>
        <p class="control__subtitle">工具访问与使用数据分析</p>
      </div>
      <div class="control__actions">
        <el-tag v-if="!analytics.remoteEnabled" size="small" type="warning">
          未配置远程数据库
        </el-tag>
        <el-tag v-else size="small" type="success">远程数据库已连接</el-tag>
        <el-button-group v-if="analytics.remoteEnabled">
          <el-button
            size="small"
            :type="analytics.dataSource === 'local' ? 'primary' : 'default'"
            @click="switchSource('local')"
          >
            本地数据
          </el-button>
          <el-button
            size="small"
            :type="analytics.dataSource === 'remote' ? 'primary' : 'default'"
            @click="switchSource('remote')"
          >
            全局数据
          </el-button>
        </el-button-group>
        <el-button v-if="analytics.dataSource === 'remote'" size="small" @click="refreshData">
          刷新
        </el-button>
        <el-button size="small" @click="clearData">清除本地数据</el-button>
        <el-button size="small" @click="goHome">返回首页</el-button>
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="control__overview">
      <div class="control__stat-card">
        <div class="control__stat-value">{{ analytics.uniqueVisitors }}</div>
        <div class="control__stat-label">独立访客数</div>
      </div>
      <div class="control__stat-card">
        <div class="control__stat-value">{{ analytics.totalVisits }}</div>
        <div class="control__stat-label">总访问次数</div>
      </div>
      <div class="control__stat-card">
        <div class="control__stat-value">{{ analytics.todayVisits }}</div>
        <div class="control__stat-label">今日访问</div>
      </div>
      <div class="control__stat-card">
        <div class="control__stat-value">{{ formatDuration(analytics.totalDuration) }}</div>
        <div class="control__stat-label">总使用时长</div>
      </div>
      <div class="control__stat-card">
        <div class="control__stat-value">{{ formatDuration(analytics.todayDuration) }}</div>
        <div class="control__stat-label">今日使用时长</div>
      </div>
      <div class="control__stat-card">
        <div class="control__stat-value">{{ analytics.toolStats.length }}</div>
        <div class="control__stat-label">使用过的工具数</div>
      </div>
    </div>

    <!-- 工具维度统计表 -->
    <section class="control__section">
      <h2>工具访问排行</h2>
      <el-table :data="sortedToolStats" stripe style="width: 100%">
        <el-table-column label="排名" width="70" type="index" />
        <el-table-column label="工具名称" min-width="140">
          <template #default="{ row }">
            <span class="control__tool-name">{{ getToolName(row.toolId) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getToolCategory(row.toolId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="访问次数" prop="totalVisits" width="100" sortable />
        <el-table-column label="独立访客" prop="uniqueVisitors" width="100" sortable />
        <el-table-column label="总时长" width="120" sortable :sort-by="'totalDuration'">
          <template #default="{ row }">
            {{ formatDuration(row.totalDuration) }}
          </template>
        </el-table-column>
        <el-table-column label="平均时长" width="120" sortable :sort-by="'avgDuration'">
          <template #default="{ row }">
            {{ formatDuration(row.avgDuration) }}
          </template>
        </el-table-column>
        <el-table-column label="最后访问" width="130">
          <template #default="{ row }">
            {{ formatTime(row.lastVisit) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 访客分析 -->
    <section class="control__section">
      <h2>访客分析 <span class="control__count">共 {{ sortedVisitorStats.length }} 人</span></h2>
      <div v-if="sortedVisitorStats.length === 0" class="control__empty">
        暂无访客数据
      </div>
      <el-table v-else :data="sortedVisitorStats" stripe style="width: 100%">
        <el-table-column label="访客" width="130">
          <template #default="{ row }">
            <span class="control__visitor-id">{{ maskSession(row.sessionId) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="访问次数" prop="visitCount" width="90" sortable />
        <el-table-column label="使用工具数" prop="toolCount" width="100" sortable />
        <el-table-column label="访问的工具" min-width="240">
          <template #default="{ row }">
            <el-tag
              v-for="toolId in row.toolsUsed"
              :key="toolId"
              size="small"
              class="control__tool-tag"
            >
              {{ getToolName(toolId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总时长" width="110" sortable :sort-by="'totalDuration'">
          <template #default="{ row }">
            {{ formatDuration(row.totalDuration) }}
          </template>
        </el-table-column>
        <el-table-column label="首次访问" width="130">
          <template #default="{ row }">
            {{ formatTime(row.firstVisit) }}
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" width="130">
          <template #default="{ row }">
            {{ formatTime(row.lastVisit) }}
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 每日访问趋势 -->
    <section class="control__section">
      <h2>每日访问趋势</h2>
      <div v-if="sortedDailyStats.length === 0" class="control__empty">
        暂无数据
      </div>
      <div v-else ref="chartRef" class="control__linechart" />
    </section>

    <!-- 今日明细 -->
    <section class="control__section">
      <h2>今日访问明细</h2>
      <div v-if="analytics.todayRecords.length === 0" class="control__empty">
        今日暂无访问记录
      </div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="(record, idx) in [...analytics.todayRecords].reverse()"
          :key="idx"
          :timestamp="new Date(record.ts).toLocaleTimeString('zh-CN')"
          placement="top"
        >
          <span class="control__timeline-tool">{{ getToolName(record.toolId) }}</span>
          <span v-if="record.duration > 0" class="control__timeline-duration">
            停留 {{ formatDuration(record.duration) }}
          </span>
        </el-timeline-item>
      </el-timeline>
    </section>
  </div>
</template>

<style scoped>
.control {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
}

.control__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.control__header h1 {
  margin: 0 0 4px;
  font-size: 24px;
}

.control__subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.control__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.control__overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.control__stat-card {
  padding: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
  text-align: center;
}

.control__stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.control__stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.control__section {
  margin-bottom: 32px;
}

.control__section h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

.control__tool-name {
  font-weight: 600;
}

.control__count {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.control__visitor-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.control__tool-tag {
  margin: 2px 4px 2px 0;
}

.control__chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 160px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  overflow-x: auto;
}

.control__chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-width: 36px;
  height: 100%;
  gap: 4px;
}

.control__chart-fill {
  width: 24px;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: var(--el-color-primary);
  transition: height 0.3s;
}

.control__chart-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.control__empty {
  padding: 32px;
  text-align: center;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.control__timeline-tool {
  font-weight: 600;
}

.control__timeline-duration {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
