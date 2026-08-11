<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Download, Delete, Sort, Search } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import CopyButton from '@/shared/components/CopyButton.vue'
import {
  COORD_SYSTEMS,
  getSystemMeta,
  convert,
  parseLine,
  formatCoord,
  type CoordSystem,
  type CoordSystemMeta,
} from './utils'

type Tab = 'single' | 'batch'

const activeTab = ref<Tab>('single')

/* ---------------- 坐标系选择弹窗 ---------------- */
const dialogVisible = ref(false)
const dialogTarget = ref<'from' | 'to'>('from')
const dialogScope = ref<'single' | 'batch'>('single')
const dialogSearch = ref('')

const filteredSystems = computed(() => {
  const q = dialogSearch.value.trim().toLowerCase()
  if (!q) return COORD_SYSTEMS
  return COORD_SYSTEMS.filter((s) =>
    [s.code, s.label, s.desc, s.area, s.unit, s.value].join(' ').toLowerCase().includes(q),
  )
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

/* ---------------- 单个转换 ---------------- */
const singleFrom = ref<CoordSystem>('WGS84')
const singleTo = ref<CoordSystem>('GCJ02')
const xInput = ref<string>('116.404')
const yInput = ref<string>('39.915')

const singleFromMeta = computed(() => getSystemMeta(singleFrom.value))
const singleToMeta = computed(() => getSystemMeta(singleTo.value))

const xLabel = computed(() => (singleFromMeta.value.type === 'proj' ? 'X' : 'Longitude'))
const yLabel = computed(() => (singleFromMeta.value.type === 'proj' ? 'Y' : 'Latitude'))

const xPlaceholder = computed(() =>
  singleFromMeta.value.type === 'proj' ? 'e.g. 12958175.41' : 'e.g. 116.404',
)
const yPlaceholder = computed(() =>
  singleFromMeta.value.type === 'proj' ? 'e.g. 4852834.06' : 'e.g. 39.915',
)

const outXLabel = computed(() => (singleToMeta.value.type === 'proj' ? 'X' : 'Longitude'))
const outYLabel = computed(() => (singleToMeta.value.type === 'proj' ? 'Y' : 'Latitude'))

const singleResult = computed<[number, number] | null>(() => {
  const x = Number(xInput.value)
  const y = Number(yInput.value)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return convert(x, y, singleFrom.value, singleTo.value)
})

const singleResultText = computed(() => {
  if (!singleResult.value) return ''
  const r = singleResult.value
  const meta = singleToMeta.value
  return `${formatCoord(r[0], meta.type)}, ${formatCoord(r[1], meta.type)}`
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

const batchXLabel = computed(() => (batchFromMeta.value.type === 'proj' ? 'X' : '经度'))
const batchYLabel = computed(() => (batchFromMeta.value.type === 'proj' ? 'Y' : '纬度'))

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
    const parsed = parseLine(line)
    if (!parsed) {
      return { index: index + 1, source: line.trim(), valid: false }
    }
    const target = convert(parsed[0], parsed[1], batchFrom.value, batchTo.value)
    return {
      index: index + 1,
      source: `${formatCoord(parsed[0], batchFromMeta.value.type)}, ${formatCoord(parsed[1], batchFromMeta.value.type)}`,
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
  const xColName = `${toMeta.code} ${toMeta.type === 'proj' ? 'X(m)' : 'Longitude'}`
  const yColName = `${toMeta.code} ${toMeta.type === 'proj' ? 'Y(m)' : 'Latitude'}`

  const data = validRows.map((r) => ({
    '#': r.index,
    'Source': r.source,
    [xColName]: formatCoord(r.target![0], toMeta.type),
    [yColName]: formatCoord(r.target![1], toMeta.type),
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transform result')
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
      <p>WGS84 / CGCS2000 / GCJ-02 / BD-09 / Web Mercator / 高斯-克吕格 等坐标系互转</p>
    </div>

    <el-tabs v-model="activeTab" class="coord-tabs">
      <!-- ==================== 单个转换 ==================== -->
      <el-tab-pane label="单个转换" name="single">
        <div class="converter">
          <!-- 顶部：源 / 交换 / 目标 坐标系选择 -->
          <div class="converter__systems">
            <!-- 输入坐标系 -->
            <div class="crs-card">
              <div class="crs-card__title">Input coordinate system</div>
              <div class="crs-card__name">
                <span class="crs-code">{{ singleFromMeta.code }}</span>
                <span class="crs-label">{{ singleFromMeta.label }}</span>
              </div>
              <button class="btn-change" @click="openDialog('single', 'from')">Change</button>
              <div class="crs-card__details">
                <div class="crs-detail"><span class="detail-key">Unit:</span> {{ singleFromMeta.unit === 'degree' ?
                  'degree' : 'metre' }}</div>
                <div class="crs-detail"><span class="detail-key">Area of use:</span> {{ singleFromMeta.area }}</div>
                <div class="crs-detail"><span class="detail-key">Accuracy:</span> Unknown</div>
              </div>
            </div>

            <!-- 中间按钮 -->
            <div class="converter__center">
              <button class="btn-swap" @click="swapSingle" title="Swap">
                <el-icon>
                  <Sort />
                </el-icon>
              </button>
            </div>

            <!-- 输出坐标系 -->
            <div class="crs-card crs-card--output">
              <div class="crs-card__title">Output coordinate system</div>
              <div class="crs-card__name">
                <span class="crs-code">{{ singleToMeta.code }}</span>
                <span class="crs-label">{{ singleToMeta.label }}</span>
              </div>
              <button class="btn-change" @click="openDialog('single', 'to')">Change</button>
              <div class="crs-card__details">
                <div class="crs-detail"><span class="detail-key">Unit:</span> {{ singleToMeta.unit === 'degree' ?
                  'degree' : 'metre' }}</div>
                <div class="crs-detail"><span class="detail-key">Area of use:</span> {{ singleToMeta.area }}</div>
                <div class="crs-detail"><span class="detail-key">Accuracy:</span> Unknown</div>
              </div>
            </div>
          </div>

          <!-- 底部：输入坐标 / 输出坐标 -->
          <div class="converter__coords">
            <!-- 输入 -->
            <div class="coord-block">
              <div class="coord-block__title">Input coordinates</div>
              <div class="coord-row">
                <label class="coord-label">{{ xLabel }}:</label>
                <input v-model="xInput" class="coord-input" type="text" :placeholder="xPlaceholder" />
              </div>
              <div class="coord-row">
                <label class="coord-label">{{ yLabel }}:</label>
                <input v-model="yInput" class="coord-input" type="text" :placeholder="yPlaceholder" />
              </div>
              <div class="coord-format">
                <span class="format-tag">Format: decimal</span>
              </div>
            </div>

            <!-- 输出 -->
            <div class="coord-block coord-block--output">
              <div class="coord-block__title">Output coordinates</div>
              <template v-if="singleResult">
                <div class="coord-row">
                  <label class="coord-label">{{ outXLabel }}:</label>
                  <code class="coord-output">{{ formatCoord(singleResult[0], singleToMeta.type) }}</code>
                </div>
                <div class="coord-row">
                  <label class="coord-label">{{ outYLabel }}:</label>
                  <code class="coord-output">{{ formatCoord(singleResult[1], singleToMeta.type) }}</code>
                </div>
                <div class="coord-row coord-row--copy">
                  <label class="coord-label">Pair:</label>
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
              <button class="btn-change btn-change--sm" @click="openDialog('batch', 'from')">Change</button>
            </div>
            <button class="btn-swap btn-swap--sm" @click="swapBatch" title="Swap">
              <el-icon>
                <Sort />
              </el-icon>
            </button>
            <div class="batch-crs">
              <span class="crs-code">{{ batchToMeta.code }}</span>
              <span class="crs-label">{{ batchToMeta.label }}</span>
              <button class="btn-change btn-change--sm" @click="openDialog('batch', 'to')">Change</button>
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
            <span class="stat-ok">✓ {{ validCount }} valid</span>
            <span v-if="invalidCount" class="stat-err">✗ {{ invalidCount }} invalid</span>
            <span v-if="fileName" class="stat-file">from {{ fileName }}</span>
          </div>

          <div class="batch__body">
            <div class="batch__input">
              <div class="batch__input-label">
                输入坐标（每行一条，{{ batchXLabel }},{{ batchYLabel }}）
              </div>
              <textarea v-model="batchText" class="batch-textarea" :placeholder="batchFromMeta.type === 'proj'
                ? '12958175.41,4852834.06\n13513477.24,3657920.29'
                : '116.404,39.915\n121.4737,31.2304\n113.2644,23.1291'"></textarea>
            </div>

            <div class="batch__table">
              <div class="batch__table-label">{{ resultColLabel }}</div>
              <table class="result-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Source</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in batchRows" :key="row.index" :class="{ 'row-invalid': !row.valid }">
                    <td>{{ row.index }}</td>
                    <td>{{ row.source }}</td>
                    <td v-if="row.valid">
                      {{ formatCoord(row.target![0], batchToMeta.type) }}, {{ formatCoord(row.target![1],
                        batchToMeta.type) }}
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
    <el-dialog v-model="dialogVisible" title="Coordinate reference system" width="680px" :close-on-click-modal="true"
      append-to-body>
      <div class="crs-search">
        <el-input v-model="dialogSearch" :prefix-icon="Search"
          placeholder="Search by code, name, or area… e.g. WGS84, CGCS2000, Mercator, 百度" clearable autofocus />
      </div>
      <div class="crs-list">
        <div class="crs-list__header">
          <span class="col-code">Code</span>
          <span class="col-name">Name</span>
          <span class="col-area">Area</span>
          <span class="col-unit">Unit</span>
        </div>
        <div class="crs-list__body">
          <div v-for="sys in filteredSystems" :key="sys.value" class="crs-list__row" @click="selectSystem(sys)">
            <span class="col-code">{{ sys.code }}</span>
            <span class="col-name">{{ sys.label }} <small>{{ sys.desc }}</small></span>
            <span class="col-area">{{ sys.area }}</span>
            <span class="col-unit">{{ sys.unit === 'degree' ? 'degree' : 'metre' }}</span>
          </div>
          <div v-if="!filteredSystems.length" class="crs-list__empty">No results</div>
        </div>
      </div>
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
  border-top: 2px solid #d0d7de;
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
