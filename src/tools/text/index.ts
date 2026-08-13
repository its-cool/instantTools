import { registerTool } from '@/core/registry'

registerTool({
  id: 'text-diff',
  name: '文本对比',
  description: '并排对比两段文本，高亮差异，支持多种语言',
  category: 'text',
  icon: 'Document',
  route: '/text/diff',
  component: () => import('./TextDiff.vue'),
  keywords: ['diff', '对比', '文本', '差异', '比较', 'compare'],
})
