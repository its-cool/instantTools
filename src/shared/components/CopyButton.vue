<script setup lang="ts">
import { copyToClipboard } from '@/shared/utils/download'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  text: string
  label?: string
}>()

async function handleCopy() {
  const ok = await copyToClipboard(props.text)
  ElMessage[ok ? 'success' : 'error'](ok ? '已复制到剪贴板' : '复制失败')
}
</script>

<template>
  <el-button size="small" @click="handleCopy">
    {{ label ?? '复制' }}
  </el-button>
</template>
