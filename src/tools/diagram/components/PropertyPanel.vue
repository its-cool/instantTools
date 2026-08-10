<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Cell, Graph } from '@antv/x6'

const props = defineProps<{
  graph: Graph | null
}>()

const selectedLabel = ref('')
const fillColor = ref('#EFF4FF')
const strokeColor = ref('#5F95FF')
const fontSize = ref(14)
let selectedCell: Cell | null = null

function syncFromCell(cell: Cell | null) {
  selectedCell = cell
  if (!cell || !cell.isNode()) {
    selectedLabel.value = ''
    return
  }

  selectedLabel.value = cell.attr('label/text') as string ?? cell.prop('label') ?? ''
  fillColor.value = (cell.attr('body/fill') as string) ?? '#EFF4FF'
  strokeColor.value = (cell.attr('body/stroke') as string) ?? '#5F95FF'
  fontSize.value = Number(cell.attr('label/fontSize') ?? 14)
}

function applyLabel() {
  if (!selectedCell?.isNode() || !props.graph) return
  selectedCell.setAttrByPath('label/text', selectedLabel.value)
  selectedCell.prop('label', selectedLabel.value)
}

function applyFill() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('body/fill', fillColor.value)
}

function applyStroke() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('body/stroke', strokeColor.value)
}

function applyFontSize() {
  if (!selectedCell?.isNode()) return
  selectedCell.setAttrByPath('label/fontSize', fontSize.value)
}

watch(
  () => props.graph,
  (graph) => {
    if (!graph) return

    graph.on('selection:changed', ({ selected }) => {
      syncFromCell(selected[0] ?? null)
    })

    graph.on('cell:change:attrs', ({ cell }) => {
      if (selectedCell?.id === cell.id) {
        syncFromCell(cell)
      }
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="property-panel">
    <h4>属性</h4>
    <template v-if="selectedCell">
      <el-form label-width="70px" size="small">
        <el-form-item label="文本">
          <el-input v-model="selectedLabel" @change="applyLabel" />
        </el-form-item>
        <el-form-item label="填充色">
          <el-color-picker v-model="fillColor" @change="applyFill" />
        </el-form-item>
        <el-form-item label="边框色">
          <el-color-picker v-model="strokeColor" @change="applyStroke" />
        </el-form-item>
        <el-form-item label="字号">
          <el-input-number v-model="fontSize" :min="10" :max="32" @change="applyFontSize" />
        </el-form-item>
      </el-form>
    </template>
    <el-empty v-else description="选择节点编辑属性" :image-size="60" />
  </div>
</template>

<style scoped>
.property-panel {
  padding: 12px;
  border-left: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  width: 220px;
  flex-shrink: 0;
}

.property-panel h4 {
  margin: 0 0 12px;
  font-size: 14px;
}
</style>
