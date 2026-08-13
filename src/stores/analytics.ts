import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { getItem, setItem } from '@/shared/utils/storage'
import {
  isRemoteConfigured,
  insertVisit,
  updateVisitDuration,
  fetchAllVisits,
  type RemoteVisitRecord,
} from '@/shared/utils/analyticsClient'

/** 单条访问记录 */
export interface VisitRecord {
  toolId: string
  ts: number
  duration: number
  sessionId: string
}

/** 每日汇总 */
export interface DailyStats {
  date: string
  visits: Record<string, number>
  uniqueVisitors: Record<string, number>
  totalDuration: Record<string, number>
}

/** 工具维度汇总 */
export interface ToolStats {
  toolId: string
  totalVisits: number
  uniqueVisitors: number
  totalDuration: number
  avgDuration: number
  lastVisit: number
}

/** 访客维度汇总 */
export interface VisitorStats {
  sessionId: string
  visitCount: number
  toolsUsed: string[]
  toolCount: number
  totalDuration: number
  firstVisit: number
  lastVisit: number
}

const ANALYTICS_KEY = 'analytics-data'
const SESSION_KEY = 'analytics-session'

export const useAnalyticsStore = defineStore('analytics', () => {
  const records = ref<VisitRecord[]>([])
  const sessionId = ref<string>('')
  const currentToolEnterTime = ref<number>(0)
  const currentToolId = ref<string>('')
  const currentRecordTs = ref<number>(0)
  const remoteEnabled = ref<boolean>(isRemoteConfigured())
  const remoteRecords = ref<VisitRecord[]>([])
  const dataSource = ref<'local' | 'remote'>('local')

  const todayStr = () => new Date().toISOString().slice(0, 10)

  async function init() {
    let saved: VisitRecord[] | null = null
    try {
      saved = await getItem<VisitRecord[]>(ANALYTICS_KEY)
    } catch {
      // 读取失败（旧坏数据）时忽略，从空开始
      saved = null
    }
    if (saved?.length) {
      // 兼容旧数据：补齐缺失的 sessionId
      records.value = saved.map((r) => ({
        toolId: r.toolId,
        ts: r.ts,
        duration: r.duration,
        sessionId: r.sessionId ?? 'legacy',
      }))
    }
    let sid = await getItem<string>(SESSION_KEY)
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      await setItem(SESSION_KEY, sid)
    }
    sessionId.value = sid
    remoteEnabled.value = isRemoteConfigured()
  }

  function trackEnter(toolId: string) {
    if (currentToolEnterTime.value) {
      trackLeave()
    }
    const ts = Date.now()
    currentToolEnterTime.value = ts
    currentToolId.value = toolId
    currentRecordTs.value = ts
    records.value.push({ toolId, ts, duration: 0, sessionId: sessionId.value })
    persist()
    if (remoteEnabled.value) {
      void insertVisit({
        session_id: sessionId.value,
        tool_id: toolId,
        ts,
        duration: 0,
      })
    }
  }

  function trackLeave() {
    if (!currentToolEnterTime.value) return
    const duration = Date.now() - currentToolEnterTime.value
    const last = records.value[records.value.length - 1]
    if (last && last.duration === 0) {
      last.duration = duration
    }
    const leaveToolId = currentToolId.value
    const leaveTs = currentRecordTs.value
    currentToolEnterTime.value = 0
    currentToolId.value = ''
    currentRecordTs.value = 0
    persist()
    if (remoteEnabled.value && leaveToolId && leaveTs) {
      void updateVisitDuration(sessionId.value, leaveToolId, leaveTs, duration)
    }
  }

  function persist() {
    // 用 toRaw 取出原始数组，避免 Vue 响应式 Proxy 无法被 IndexedDB structured clone 克隆
    void setItem(ANALYTICS_KEY, toRaw(records.value))
  }

  function clearAll() {
    records.value = []
    remoteRecords.value = []
    void setItem(ANALYTICS_KEY, [])
  }

  async function refreshRemote() {
    if (!remoteEnabled.value) {
      remoteRecords.value = []
      return
    }
    const remote = await fetchAllVisits()
    remoteRecords.value = remote.map((r: RemoteVisitRecord) => ({
      toolId: r.tool_id,
      ts: r.ts,
      duration: r.duration,
      sessionId: r.session_id,
    }))
  }

  function setDataSource(source: 'local' | 'remote') {
    dataSource.value = source
    if (source === 'remote') {
      void refreshRemote()
    }
  }

  const activeRecords = computed(() =>
    dataSource.value === 'remote' ? remoteRecords.value : records.value,
  )

  const todayRecords = computed(() =>
    activeRecords.value.filter((r) => new Date(r.ts).toISOString().slice(0, 10) === todayStr()),
  )

  const toolStats = computed<ToolStats[]>(() => {
    const map = new Map<string, ToolStats>()
    const sessionsByTool = new Map<string, Set<string>>()
    for (const r of activeRecords.value) {
      let s = map.get(r.toolId)
      if (!s) {
        s = {
          toolId: r.toolId,
          totalVisits: 0,
          uniqueVisitors: 0,
          totalDuration: 0,
          avgDuration: 0,
          lastVisit: 0,
        }
        map.set(r.toolId, s)
      }
      s.totalVisits++
      s.totalDuration += r.duration
      s.lastVisit = Math.max(s.lastVisit, r.ts)
      const sessions = sessionsByTool.get(r.toolId) ?? new Set<string>()
      sessions.add(r.sessionId)
      sessionsByTool.set(r.toolId, sessions)
    }
    return [...map.values()].map((s) => ({
      ...s,
      avgDuration: s.totalVisits ? Math.round(s.totalDuration / s.totalVisits) : 0,
      uniqueVisitors: sessionsByTool.get(s.toolId)?.size ?? 0,
    }))
  })

  const visitorStats = computed<VisitorStats[]>(() => {
    const map = new Map<string, VisitorStats>()
    for (const r of activeRecords.value) {
      let v = map.get(r.sessionId)
      if (!v) {
        v = {
          sessionId: r.sessionId,
          visitCount: 0,
          toolsUsed: [],
          toolCount: 0,
          totalDuration: 0,
          firstVisit: r.ts,
          lastVisit: 0,
        }
        map.set(r.sessionId, v)
      }
      v.visitCount++
      v.totalDuration += r.duration
      v.firstVisit = Math.min(v.firstVisit, r.ts)
      v.lastVisit = Math.max(v.lastVisit, r.ts)
      if (!v.toolsUsed.includes(r.toolId)) {
        v.toolsUsed.push(r.toolId)
      }
    }
    return [...map.values()]
      .map((v) => ({ ...v, toolCount: v.toolsUsed.length }))
      .sort((a, b) => b.lastVisit - a.lastVisit)
  })

  const dailyStats = computed<DailyStats[]>(() => {
    const map = new Map<string, DailyStats>()
    const sessionsByDayTool = new Map<string, Set<string>>()
    for (const r of activeRecords.value) {
      const date = new Date(r.ts).toISOString().slice(0, 10)
      let d = map.get(date)
      if (!d) {
        d = { date, visits: {}, uniqueVisitors: {}, totalDuration: {} }
        map.set(date, d)
      }
      d.visits[r.toolId] = (d.visits[r.toolId] ?? 0) + 1
      const key = `${date}-${r.toolId}`
      const sessions = sessionsByDayTool.get(key) ?? new Set<string>()
      sessions.add(r.sessionId)
      sessionsByDayTool.set(key, sessions)
      d.uniqueVisitors[r.toolId] = sessions.size
      d.totalDuration[r.toolId] = (d.totalDuration[r.toolId] ?? 0) + r.duration
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
  })

  const totalVisits = computed(() => activeRecords.value.length)
  const totalDuration = computed(() => activeRecords.value.reduce((sum, r) => sum + r.duration, 0))
  const todayVisits = computed(() => todayRecords.value.length)
  const todayDuration = computed(() => todayRecords.value.reduce((sum, r) => sum + r.duration, 0))
  const uniqueVisitors = computed(() => visitorStats.value.length)

  return {
    records,
    sessionId,
    remoteEnabled,
    dataSource,
    toolStats,
    visitorStats,
    dailyStats,
    totalVisits,
    totalDuration,
    todayVisits,
    todayDuration,
    todayRecords,
    uniqueVisitors,
    init,
    trackEnter,
    trackLeave,
    clearAll,
    refreshRemote,
    setDataSource,
  }
})
