<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Download, Delete, Sort, Search, Plus } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import CopyButton from '@/shared/components/CopyButton.vue'
import {
  getAllSystems,
  getSystemMeta,
  addCustomSystem,
  removeCustomSystem,
  getCustomSystems,
  convert,
  formatCoord,
  dmsToDecimal,
  type CoordSystem,
  type CoordSystemMeta,
  type CustomCrsDef,
} from './utils'

type Tab = 'single' | 'batch'
type CoordFormat = 'decimal' | 'dms'

const activeTab = ref<Tab>('single')
const coordFormat = ref<CoordFormat>('decimal')

function toggleFormat() {
  coordFormat.value = coordFormat.value === 'decimal' ? 'dms' : 'decimal'
}

/* ---------------- 坐标系选择弹窗 ---------------- */
const dialogVisible = ref(false)
const dialogTarget = ref<'from' | 'to'>('from')
const dialogScope = ref<'single' | 'batch'>('single')
const dialogSearch = ref('')

/** 触发弹窗列表刷新的自增 key */
const listVersion = ref(0)

const allSystems = computed(() => {
  void listVersion.value
  return getAllSystems()
})

/** 分组标签映射 */
const GROUP_LABELS: Record<string, string> = {
  'global': '全球地理坐标系',
  'china-geo': '国家地理坐标系',
  'legacy': '旧标准坐标系（北京54/西安80）',
  'china-encrypt': '国内加密坐标系',
  'projection': '投影坐标系',
  'custom': '自定义坐标系',
}

/** 按分组组织搜索结果 */
const groupedSystems = computed(() => {
  const q = dialogSearch.value.trim().toLowerCase()
  const systems = q
    ? allSystems.value.filter((s) =>
      [s.code, s.label, s.desc, s.area, s.unit, s.value].join(' ').toLowerCase().includes(q),
    )
    : allSystems.value

  const groups: { key: string; label: string; items: CoordSystemMeta[] }[] = []
  for (const [key, label] of Object.entries(GROUP_LABELS)) {
    const items = systems.filter((s) => s.group === key)
    if (items.length) groups.push({ key, label, items })
  }
  return groups
})

function openDialog(scope: 'single' | 'batch', target: 'from' | 'to') {
  dialogScope.value = scope
  dialogTarget.value = target
  dialogSearch.value = ''
  dialogVisible.value = true
}

function selectSystem(sys: CoordSystemMeta) {
  if (dialogScope.value === 'single') {
    if (dialogTarget.value === 'from') {
      singleFrom.value = sys.value
    } else {
      singleTo.value = sys.value
    }
  } else {
    if (dialogTarget.value === 'from') {
      batchFrom.value = sys.value
    } else {
      batchTo.value = sys.value
    }
  }
  dialogVisible.value = false
}

/* ---------------- 自定义坐标系管理 ---------------- */
const customDialogVisible = ref(false)
const editingCustom = ref<CustomCrsDef | null>(null)

const defaultCustomDef: CustomCrsDef = {
  id: '',
  name: '',
  ellipsoid: 'GRS80',
  type: 'proj',
  projection: {
    kind: 'tmerc',
    centralMeridian: 117,
    falseEasting: 500000,
    falseNorthing: 0,
    scaleFactor: 1,
  },
  toWgs84Params: { dX: 0, dY: 0, dZ: 0, rX: 0, rY: 0, rZ: 0, m: 0 },
  area: 'China',
}

const customForm = ref<CustomCrsDef>({ ...defaultCustomDef })
const useSevenParam = ref(false)

function openCustomDialog() {
  editingCustom.value = null
  customForm.value = {
    ...defaultCustomDef,
    projection: { ...defaultCustomDef.projection! },
    toWgs84Params: { ...defaultCustomDef.toWgs84Params! },
  }
  useSevenParam.value = false
  customDialogVisible.value = true
}

function editCustom(def: CustomCrsDef) {
  editingCustom.value = def
  customForm.value = {
    ...def,
    projection: def.projection ? { ...def.projection } : undefined,
    toWgs84Params: def.toWgs84Params ? { ...def.toWgs84Params } : undefined,
  }
  useSevenParam.value = !!def.toWgs84Params
  customDialogVisible.value = true
}

function saveCustom() {
  const f = customForm.value
  if (!f.name.trim()) {
    ElMessage.warning('请输入坐标系名称')
    return
  }
  if (!f.id.trim()) {
    f.id = 'crs_' + Date.now().toString(36)
  }

  const def: CustomCrsDef = {
    ...f,
    projection: f.type === 'proj' ? f.projection : undefined,
    toWgs84Params: useSevenParam.value ? f.toWgs84Params : undefined,
  }

  addCustomSystem(def)
  listVersion.value++
  ElMessage.success(`自定义坐标系「${def.name}」已保存`)
  customDialogVisible.value = false
}

function deleteCustom(id: string) {
  removeCustomSystem(id)
  listVersion.value++
  ElMessage.success('已删除自定义坐标系')
}

const customList = computed(() => {
  void listVersion.value
  return getCustomSystems()
})

/* ---------------- 单个转换 ---------------- */
const singleFrom = ref<CoordSystem>('WGS84')
const singleTo = ref<CoordSystem>('GCJ02')
const xInput = ref<string>('116.404')
const yInput = ref<string>('39.915')

const singleFromMeta = computed(() => getSystemMeta(singleFrom.value))
const singleToMeta = computed(() => getSystemMeta(singleTo.value))

const effectiveFormat = computed(() => {
  if (singleFromMeta.value.type === 'proj' || singleToMeta.value.type === 'proj') {
    return 'decimal' as const
  }
  return coordFormat.value
})

const xLabel = computed(() => (singleFromMeta.value.type === 'proj' ? 'X' : '经度'))
const yLabel = computed(() => (singleFromMeta.value.type === 'proj' ? 'Y' : '纬度'))

const xPlaceholder = computed(() => {
  if (singleFromMeta.value.type === 'proj') return '例如 12958175.41'
  return effectiveFormat.value === 'dms' ? `例如 116°24'14.40"` : '例如 116.404'
})
const yPlaceholder = computed(() => {
  if (singleFromMeta.value.type === 'proj') return '例如 4852834.06'
  return effectiveFormat.value === 'dms' ? `例如 39°54'54.00"` : '例如 39.915'
})

const outXLabel = computed(() => (singleToMeta.value.type === 'proj' ? 'X' : '经度'))
const outYLabel = computed(() => (singleToMeta.value.type === 'proj' ? 'Y' : '纬度'))

const singleResult = computed<[number, number] | null>(() => {
  const x = dmsToDecimal(xInput.value) ?? Number(xInput.value)
  const y = dmsToDecimal(yInput.value) ?? Number(yInput.value)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return convert(x, y, singleFrom.value, singleTo.value)
})

const singleResultText = computed(() => {
  if (!singleResult.value) return ''
  const r = singleResult.value
  const meta = singleToMeta.value
  return `${formatCoord(r[0], meta.type, effectiveFormat.value)}, ${formatCoord(r[1], meta.type, effectiveFormat.value)}`
})

function swapSingle() {
  const tmp = singleFrom.value
  singleFrom.value = singleTo.value
  singleTo.value = tmp
}

/* ---------------- 批量转换 ---------------- */
const batchFrom = ref<CoordSystem>('WGS84')
const batchTo = ref<CoordSystem>('GCJ02')
const batchText = ref<string>('')
const fileName = ref<string>('')

const batchFromMeta = computed(() => getSystemMeta(batchFrom.value))
const batchToMeta = computed(() => getSystemMeta(batchTo.value))

const batchEffectiveFormat = computed(() => {
  if (batchFromMeta.value.type === 'proj' || batchToMeta.value.type === 'proj') {
    return 'decimal' as const
  }
  return coordFormat.value
})

const batchXLabel = computed(() => (batchFromMeta.value.type === 'proj' ? 'X' : '经度'))
const batchYLabel = computed(() => (batchFromMeta.value.type === 'proj' ? 'Y' : '纬度'))

const batchPlaceholder = computed(() => {
  if (batchFromMeta.value.type === 'proj') {
    return '12958175.41,4852834.06\n13513477.24,3657920.29'
  }
  if (batchEffectiveFormat.value === 'dms') {
    return `116°24'14.40",39°54'54.00"\n121°28'25.32",31°13'49.44"`
  }
  return '116.404,39.915\n121.4737,31.2304\n113.2644,23.1291'
})

const resultColLabel = computed(() => {
  const toMeta = batchToMeta.value
  return `${toMeta.code} ${toMeta.label} (${toMeta.type === 'proj' ? 'X, Y' : '经度, 纬度'})`
})

interface BatchRow {
  index: number
  source: string
  valid: boolean
  target?: [number, number]
}

const batchRows = computed<BatchRow[]>(() => {
  const lines = batchText.value.split(/\r?\n/).filter((l) => l.trim())
  return lines.map((line, index) => {
    const parts = line.trim().split(/[,，\s]+/).filter(Boolean)
    if (parts.length < 2) {
      return { index: index + 1, source: line.trim(), valid: false }
    }
    const x = dmsToDecimal(parts[0]) ?? Number(parts[0])
    const y = dmsToDecimal(parts[1]) ?? Number(parts[1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { index: index + 1, source: line.trim(), valid: false }
    }
    const parsed: [number, number] = [x, y]
    const target = convert(parsed[0], parsed[1], batchFrom.value, batchTo.value)
    return {
      index: index + 1,
      source: `${formatCoord(parsed[0], batchFromMeta.value.type, batchEffectiveFormat.value)}, ${formatCoord(parsed[1], batchFromMeta.value.type, batchEffectiveFormat.value)}`,
      valid: true,
      target,
    }
  })
})

const validCount = computed(() => batchRows.value.filter((r) => r.valid).length)
const invalidCount = computed(() => batchRows.value.filter((r) => !r.valid).length)

function swapBatch() {
  const tmp = batchFrom.value
  batchFrom.value = batchTo.value
  batchTo.value = tmp
}

/* ---------------- Excel 导入 ---------------- */
const importDialogVisible = ref(false)
const importColumns = ref<string[]>([])
const importRows = ref<number[][]>([])
const xCol = ref<string>('')
const yCol = ref<string>('')

const fileInput = shallowRef<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fileName.value = file.name

  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })

      if (json.length < 2) {
        ElMessage.warning('Excel 数据为空或只有表头')
        return
      }

      const header = json[0].map((h, i) => String(h ?? `列${i + 1}`))
      const dataRows = json.slice(1)
        .map((row) => (row as unknown[]).map((cell) => Number(cell)))
        .filter((row) => row.length >= 2 && row.some((v) => Number.isFinite(v)))

      importColumns.value = header
      importRows.value = dataRows

      const xIdx = header.findIndex((h) => /经|lng|lon|longitude|\bx\b|x坐标|x值/i.test(h))
      const yIdx = header.findIndex((h) => /纬|lat|latitude|\by\b|y坐标|y值/i.test(h))
      xCol.value = xIdx >= 0 ? header[xIdx] : header[0]
      yCol.value = yIdx >= 0 ? header[yIdx] : header[1] ?? header[0]

      importDialogVisible.value = true
    } catch {
      ElMessage.error('Excel 解析失败')
    }
  }
  reader.readAsArrayBuffer(file)
  input.value = ''
}

function confirmImport() {
  const xIdx = importColumns.value.indexOf(xCol.value)
  const yIdx = importColumns.value.indexOf(yCol.value)
  if (xIdx < 0 || yIdx < 0) {
    ElMessage.warning('请选择有效的坐标列')
    return
  }

  const lines: string[] = []
  for (const row of importRows.value) {
    const x = row[xIdx]
    const y = row[yIdx]
    if (Number.isFinite(x) && Number.isFinite(y)) {
      lines.push(`${x},${y}`)
    }
  }

  if (batchText.value.trim()) {
    batchText.value = batchText.value.trim() + '\n' + lines.join('\n')
  } else {
    batchText.value = lines.join('\n')
  }

  ElMessage.success(`已导入 ${lines.length} 条数据`)
  importDialogVisible.value = false
  activeTab.value = 'batch'
}

/* ---------------- Excel 导出 ---------------- */
function exportExcel() {
  const validRows = batchRows.value.filter((r) => r.valid)
  if (!validRows.length) {
    ElMessage.warning('没有可导出的有效数据')
    return
  }

  const toMeta = batchToMeta.value
  const xColName = `${toMeta.code} ${toMeta.type === 'proj' ? 'X(m)' : '经度'}`
  const yColName = `${toMeta.code} ${toMeta.type === 'proj' ? 'Y(m)' : '纬度'}`

  const data = validRows.map((r) => ({
    '#': r.index,
    '源坐标': r.source,
    [xColName]: formatCoord(r.target![0], toMeta.type, batchEffectiveFormat.value),
    [yColName]: formatCoord(r.target![1], toMeta.type, batchEffectiveFormat.value),
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '转换结果')
  XLSX.writeFile(wb, 'coord-transform.xlsx')
  ElMessage.success('已导出 Excel')
}

function clearBatch() {
  batchText.value = ''
  fileName.value = ''
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h2>坐标转换</h2>
      <p>WGS84 / CGCS2000 / 北京54 / 西安80 / GCJ-02 / BD-09 / Web Mercator / 高斯-克吕格 / 自定义坐标系 互转</p>
    </div>

    <el-tabs v-model="activeTab" class="coord-tabs">
      <!-- ==================== 单个转换 ==================== -->
      <el-tab-pane label="单个转换" name="single">
        <div class="converter">
          <!-- 顶部：源 / 交换 / 目标 坐标系选择 -->
          <div class="converter__systems">
            <!-- 输入坐标系 -->
            <div class="crs-card">
              <div class="crs-card__title">输入坐标系</div>
              <div class="crs-card__name">
                <span class="crs-code">{{ singleFromMeta.code }}</span>
                <span class="crs-label">{{ singleFromMeta.label }}</span>
              </div>
              <button class="btn-change" @click="openDialog('single', 'from')">切换</button>
              <div class="crs-card__details">
                <div class="crs-detail"><span class="detail-key">单位:</span> {{ singleFromMeta.unit === 'degree' ?
                  '度' : '米' }}</div>
                <div class="crs-detail"><span class="detail-key">适用区域:</span> {{ singleFromMeta.area }}</div>
                <div class="crs-detail"><span class="detail-key">精度:</span> 未知</div>
              </div>
            </div>

            <!-- 中间按钮 -->
            <div class="converter__center">
              <button class="btn-swap" @click="swapSingle" title="交换">
                <el-icon>
                  <Sort />
                </el-icon>
              </button>
            </div>

            <!-- 输出坐标系 -->
            <div class="crs-card crs-card--output">
              <div class="crs-card__title">输出坐标系</div>
              <div class="crs-card__name">
                <span class="crs-code">{{ singleToMeta.code }}</span>
                <span class="crs-label">{{ singleToMeta.label }}</span>
              </div>
              <button class="btn-change" @click="openDialog('single', 'to')">切换</button>
              <div class="crs-card__details">
                <div class="crs-detail"><span class="detail-key">单位:</span> {{ singleToMeta.unit === 'degree' ?
                  '度' : '米' }}</div>
                <div class="crs-detail"><span class="detail-key">适用区域:</span> {{ singleToMeta.area }}</div>
                <div class="crs-detail"><span class="detail-key">精度:</span> 未知</div>
              </div>
            </div>
          </div>

          <!-- 底部：输入坐标 / 输出坐标 -->
          <div class="converter__coords">
            <!-- 输入 -->
            <div class="coord-block">
              <div class="coord-block__title">输入坐标</div>
              <div class="coord-row">
                <label class="coord-label">{{ xLabel }}:</label>
                <input v-model="xInput" class="coord-input" type="text" :placeholder="xPlaceholder" />
              </div>
              <div class="coord-row">
                <label class="coord-label">{{ yLabel }}:</label>
                <input v-model="yInput" class="coord-input" type="text" :placeholder="yPlaceholder" />
              </div>
              <div class="coord-format">
                <button v-if="singleFromMeta.type === 'geo' && singleToMeta.type === 'geo'"
                  class="format-tag format-tag--clickable" @click="toggleFormat">
                  格式: {{ effectiveFormat === 'decimal' ? '十进制' : '度分秒' }}
                </button>
                <span v-else class="format-tag">格式: 十进制</span>
              </div>
            </div>

            <!-- 输出 -->
            <div class="coord-block coord-block--output">
              <div class="coord-block__title">输出坐标</div>
              <template v-if="singleResult">
                <div class="coord-row">
                  <label class="coord-label">{{ outXLabel }}:</label>
                  <code
                    class="coord-output">{{ formatCoord(singleResult[0], singleToMeta.type, effectiveFormat) }}</code>
                </div>
                <div class="coord-row">
                  <label class="coord-label">{{ outYLabel }}:</label>
                  <code
                    class="coord-output">{{ formatCoord(singleResult[1], singleToMeta.type, effectiveFormat) }}</code>
                </div>
                <div class="coord-row coord-row--copy">
                  <label class="coord-label">坐标对:</label>
                  <code class="coord-output">{{ singleResultText }}</code>
                  <CopyButton :text="singleResultText" />
                </div>
              </template>
              <div v-else class="coord-error">请输入有效的坐标数值</div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ==================== 批量转换 ==================== -->
      <el-tab-pane label="批量转换" name="batch">
        <div class="batch">
          <div class="batch__crs-bar">
            <div class="batch-crs">
              <span class="crs-code">{{ batchFromMeta.code }}</span>
              <span class="crs-label">{{ batchFromMeta.label }}</span>
              <button class="btn-change btn-change--sm" @click="openDialog('batch', 'from')">切换</button>
            </div>
            <button class="btn-swap btn-swap--sm" @click="swapBatch" title="交换">
              <el-icon>
                <Sort />
              </el-icon>
            </button>
            <div class="batch-crs">
              <span class="crs-code">{{ batchToMeta.code }}</span>
              <span class="crs-label">{{ batchToMeta.label }}</span>
              <button class="btn-change btn-change--sm" @click="openDialog('batch', 'to')">切换</button>
            </div>
            <div class="batch__actions">
              <el-button :icon="Upload" size="small" @click="triggerFileInput">导入 Excel</el-button>
              <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display: none"
                @change="handleFileChange" />
              <el-button :icon="Download" size="small" :disabled="!validCount" @click="exportExcel">导出</el-button>
              <el-button :icon="Delete" size="small" :disabled="!batchText" @click="clearBatch">清空</el-button>
            </div>
          </div>

          <div v-if="batchRows.length" class="batch__stats">
            <span class="stat-ok">✓ {{ validCount }} 条有效</span>
            <span v-if="invalidCount" class="stat-err">✗ {{ invalidCount }} 条无效</span>
            <span v-if="fileName" class="stat-file">来自 {{ fileName }}</span>
            <span class="batch-format">
              <button v-if="batchFromMeta.type === 'geo' && batchToMeta.type === 'geo'"
                class="format-tag format-tag--clickable" @click="toggleFormat">
                格式: {{ batchEffectiveFormat === 'decimal' ? '十进制' : '度分秒' }}
              </button>
              <span v-else class="format-tag">格式: 十进制</span>
            </span>
          </div>

          <div class="batch__body">
            <div class="batch__input">
              <div class="batch__input-label">
                输入坐标（每行一条，{{ batchXLabel }},{{ batchYLabel }}）
              </div>
              <textarea v-model="batchText" class="batch-textarea" :placeholder="batchPlaceholder"></textarea>
            </div>

            <div class="batch__table">
              <div class="batch__table-label">{{ resultColLabel }}</div>
              <table class="result-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>源坐标</th>
                    <th>目标坐标</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in batchRows" :key="row.index" :class="{ 'row-invalid': !row.valid }">
                    <td>{{ row.index }}</td>
                    <td>{{ row.source }}</td>
                    <td v-if="row.valid">
                      {{ formatCoord(row.target![0], batchToMeta.type, batchEffectiveFormat) }}, {{
                        formatCoord(row.target![1],
                          batchToMeta.type, batchEffectiveFormat) }}
                    </td>
                    <td v-else class="cell-invalid">—</td>
                  </tr>
                  <tr v-if="!batchRows.length">
                    <td colspan="3" class="cell-empty">输入坐标后自动转换</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ========== 坐标系搜索选择弹窗 ========== -->
    <el-dialog v-model="dialogVisible" title="坐标系选择" width="680px" :close-on-click-modal="true" append-to-body>
      <div class="crs-search">
        <el-input v-model="dialogSearch" :prefix-icon="Search" placeholder="搜索编码、名称或区域… 如 WGS84、CGCS2000、北京54、百度"
          clearable autofocus />
        <el-button :icon="Plus" size="small" type="primary" plain class="crs-add-btn"
          @click="openCustomDialog">自定义坐标系</el-button>
      </div>
      <div class="crs-list">
        <div class="crs-list__header">
          <span class="col-code">编码</span>
          <span class="col-name">名称</span>
          <span class="col-area">区域</span>
          <span class="col-unit">单位</span>
        </div>
        <div class="crs-list__body">
          <template v-for="grp in groupedSystems" :key="grp.key">
            <div class="crs-list__group">{{ grp.label }}</div>
            <div v-for="sys in grp.items" :key="sys.value" class="crs-list__row" @click="selectSystem(sys)">
              <span class="col-code">{{ sys.code }}</span>
              <span class="col-name">{{ sys.label }} <small>{{ sys.desc }}</small></span>
              <span class="col-area">{{ sys.area }}</span>
              <span class="col-unit">{{ sys.unit === 'degree' ? '度' : '米' }}</span>
            </div>
          </template>
          <div v-if="!groupedSystems.length" class="crs-list__empty">无匹配结果</div>
        </div>
      </div>
    </el-dialog>

    <!-- ========== 自定义坐标系管理弹窗 ========== -->
    <el-dialog v-model="customDialogVisible" :title="editingCustom ? '编辑自定义坐标系' : '新建自定义坐标系'" width="560px"
      append-to-body>
      <el-form :model="customForm" label-width="120px" size="small">
        <el-form-item label="坐标系名称">
          <el-input v-model="customForm.name" placeholder="如：深圳独立坐标系" />
        </el-form-item>
        <el-form-item label="椭球体">
          <el-select v-model="customForm.ellipsoid" style="width: 100%">
            <el-option label="GRS80（CGCS2000）" value="GRS80" />
            <el-option label="WGS84" value="WGS84" />
            <el-option label="克拉索夫斯基（北京54）" value="Krasovsky" />
            <el-option label="IAG75（西安80）" value="IAG75" />
          </el-select>
        </el-form-item>
        <el-form-item label="坐标系类型">
          <el-radio-group v-model="customForm.type">
            <el-radio value="geo">地理坐标系</el-radio>
            <el-radio value="proj">投影坐标系</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="customForm.type === 'proj'">
          <el-form-item label="投影类型">
            <el-select v-model="customForm.projection!.kind" style="width: 100%">
              <el-option label="高斯-克吕格（tmerc）" value="tmerc" />
              <el-option label="墨卡托（merc）" value="merc" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="customForm.projection!.kind === 'tmerc'" label="中央子午线(°)">
            <el-input-number v-model="customForm.projection!.centralMeridian!" :min="-180" :max="180" :precision="2"
              style="width: 100%" />
          </el-form-item>
          <el-form-item label="东偏(m)">
            <el-input-number v-model="customForm.projection!.falseEasting" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="北偏(m)">
            <el-input-number v-model="customForm.projection!.falseNorthing" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="比例因子">
            <el-input-number v-model="customForm.projection!.scaleFactor" :precision="6" :step="0.001"
              style="width: 100%" />
          </el-form-item>
        </template>
        <el-form-item label="适用区域">
          <el-input v-model="customForm.area" placeholder="如：深圳、上海" />
        </el-form-item>
        <el-form-item label="七参数转换">
          <el-switch v-model="useSevenParam" />
          <span class="form-hint">启用后可输入到 WGS84 的布尔莎七参数</span>
        </el-form-item>
        <template v-if="useSevenParam">
          <div class="seven-param-grid">
            <el-form-item label="ΔX(m)">
              <el-input-number v-model="customForm.toWgs84Params!.dX" :precision="3" style="width: 100%" />
            </el-form-item>
            <el-form-item label="ΔY(m)">
              <el-input-number v-model="customForm.toWgs84Params!.dY" :precision="3" style="width: 100%" />
            </el-form-item>
            <el-form-item label="ΔZ(m)">
              <el-input-number v-model="customForm.toWgs84Params!.dZ" :precision="3" style="width: 100%" />
            </el-form-item>
            <el-form-item label="εX(″)">
              <el-input-number v-model="customForm.toWgs84Params!.rX" :precision="6" style="width: 100%" />
            </el-form-item>
            <el-form-item label="εY(″)">
              <el-input-number v-model="customForm.toWgs84Params!.rY" :precision="6" style="width: 100%" />
            </el-form-item>
            <el-form-item label="εZ(″)">
              <el-input-number v-model="customForm.toWgs84Params!.rZ" :precision="6" style="width: 100%" />
            </el-form-item>
            <el-form-item label="m(ppm)">
              <el-input-number v-model="customForm.toWgs84Params!.m" :precision="6" style="width: 100%" />
            </el-form-item>
          </div>
        </template>
      </el-form>

      <!-- 已保存的自定义坐标系列表 -->
      <div v-if="customList.length" class="custom-list">
        <div class="custom-list__title">已保存的自定义坐标系</div>
        <div v-for="item in customList" :key="item.id" class="custom-list__item">
          <span class="custom-list__name">{{ item.name }}</span>
          <span class="custom-list__desc">{{ item.ellipsoid }} / {{ item.type === 'geo' ? '地理' : '投影' }}</span>
          <el-button size="small" text @click="editCustom(item)">编辑</el-button>
          <el-button size="small" text type="danger" @click="deleteCustom(item.id)">删除</el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="customDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCustom">保存</el-button>
      </template>
    </el-dialog>

    <!-- Excel 导入列选择弹窗 -->
    <el-dialog v-model="importDialogVisible" title="选择坐标列" width="460px">
      <el-form label-width="80px">
        <el-form-item :label="`${batchXLabel}列`">
          <el-select v-model="xCol" style="width: 100%">
            <el-option v-for="col in importColumns" :key="col" :label="col" :value="col" />
          </el-select>
        </el-form-item>
        <el-form-item :label="`${batchYLabel}列`">
          <el-select v-model="yCol" style="width: 100%">
            <el-option v-for="col in importColumns" :key="col" :label="col" :value="col" />
          </el-select>
        </el-form-item>
        <el-alert type="info" :closable="false" title='已自动识别含"经/纬/lng/lat/x/y"的列，可手动调整' />
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ========== 通用 ========== */
.coord-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.coord-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}

.coord-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.crs-code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-weight: 600;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.btn-change {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 20px;
  border: 1.5px solid #3b6cb5;
  background: #3b6cb5;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-change:hover {
  background: #2d5a9e;
  border-color: #2d5a9e;
}

.btn-change--sm {
  padding: 2px 10px;
  font-size: 12px;
}

/* ========== 单个转换：epsg.io 风格 ========== */
.converter {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 960px;
  margin: 0 auto;
}

.converter__systems {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: start;
}

.crs-card {
  padding-top: 12px;
}

.crs-card__title {
  font-size: 18px;
  font-weight: 400;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.crs-card__name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.crs-label {
  font-size: 15px;
  color: var(--el-text-color-regular);
}

.crs-card__details {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.detail-key {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-right: 4px;
}

.converter__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 48px;
  gap: 12px;
}

.btn-swap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-swap:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  transform: rotate(180deg);
}

.btn-swap--sm {
  width: 32px;
  height: 32px;
  font-size: 14px;
  border-width: 1.5px;
}

.converter__coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}

.coord-block__title {
  font-size: 18px;
  font-weight: 400;
  margin-bottom: 16px;
  padding-top: 12px;
  border-top: 2px solid #d0d7de;
}

.coord-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.coord-label {
  min-width: 80px;
  font-size: 15px;
  color: var(--el-text-color-secondary);
}

.coord-input {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid #d0d7de;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.coord-input:focus {
  border-color: var(--el-color-primary);
}

.coord-output {
  flex: 1;
  padding: 6px 10px;
  font-size: 15px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  word-break: break-all;
}

.coord-row--copy {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color);
}

.coord-format {
  margin-top: 8px;
}

.format-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.format-tag--clickable {
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.format-tag--clickable:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.coord-error {
  color: var(--el-color-danger);
  font-size: 14px;
  padding: 12px 0;
}

/* ========== 批量转换 ========== */
.batch {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.batch__crs-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  flex-wrap: wrap;
}

.batch-crs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch__actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.batch__stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.stat-ok {
  color: var(--el-color-success);
}

.stat-err {
  color: var(--el-color-danger);
}

.stat-file {
  color: var(--el-text-color-secondary);
}

.batch-format {
  margin-left: auto;
}

.batch__body {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.batch__input-label,
.batch__table-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.batch-textarea {
  width: 100%;
  flex: 1;
  padding: 10px;
  border: 1.5px solid #d0d7de;
  border-radius: 6px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  resize: none;
  outline: none;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  min-height: 300px;
}

.batch-textarea:focus {
  border-color: var(--el-color-primary);
}

.batch__input {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.batch__table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.result-table th,
.result-table td {
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  text-align: left;
}

.result-table th {
  background: var(--el-fill-color-light);
  font-weight: 600;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.result-table td {
  font-family: 'SFMono-Regular', Consolas, monospace;
}

.row-invalid td {
  color: var(--el-text-color-disabled);
}

.cell-invalid {
  color: var(--el-text-color-disabled);
}

.cell-empty {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 32px !important;
}

/* ========== CRS 搜索弹窗 ========== */
.crs-search {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.crs-search .el-input {
  flex: 1;
}

.crs-add-btn {
  flex-shrink: 0;
}

.crs-list {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  max-height: 420px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.crs-list__header {
  display: grid;
  grid-template-columns: 130px 1fr 100px 70px;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.crs-list__body {
  overflow-y: auto;
  flex: 1;
}

.crs-list__group {
  padding: 6px 12px;
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-extra-light);
  position: sticky;
  top: 0;
  z-index: 1;
}

.crs-list__row {
  display: grid;
  grid-template-columns: 130px 1fr 100px 70px;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  font-size: 13px;
  transition: background 0.1s;
  align-items: center;
}

.crs-list__row:hover {
  background: var(--el-color-primary-light-9);
}

.crs-list__row:last-child {
  border-bottom: none;
}

.crs-list__row .col-code {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-weight: 600;
  color: var(--el-color-primary);
  font-size: 13px;
}

.crs-list__row .col-name small {
  display: block;
  color: var(--el-text-color-secondary);
  font-weight: 400;
  font-size: 12px;
  margin-top: 2px;
}

.crs-list__row .col-area {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.crs-list__row .col-unit {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.crs-list__empty {
  text-align: center;
  padding: 32px;
  color: var(--el-text-color-placeholder);
}

/* ========== 自定义坐标系表单 ========== */
.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.seven-param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.custom-list {
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}

.custom-list__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.custom-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.custom-list__name {
  font-weight: 500;
  font-size: 13px;
}

.custom-list__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex: 1;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {

  .converter__systems,
  .converter__coords,
  .batch__body {
    grid-template-columns: 1fr;
  }

  .converter__center {
    padding-top: 0;
    flex-direction: row;
    justify-content: center;
  }

  .btn-swap {
    transform: rotate(90deg);
  }

  .btn-swap:hover {
    transform: rotate(270deg);
  }
}
</style>
