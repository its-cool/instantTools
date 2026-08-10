import { registerTool } from '@/core/registry'

registerTool({
  id: 'mindmap',
  name: '思维导图',
  description: '可视化思维导图编辑器，支持树形布局与子节点',
  category: 'diagram',
  icon: 'Picture',
  route: '/diagram/mindmap',
  component: () => import('./DiagramEditor.vue'),
  keywords: ['思维导图', 'mindmap', '脑图', '流程图'],
})

registerTool({
  id: 'sequence',
  name: '时序图',
  description: '时序图编辑器，支持生命线与消息',
  category: 'diagram',
  icon: 'Picture',
  route: '/diagram/sequence',
  component: () => import('./DiagramEditor.vue'),
  keywords: ['时序图', 'sequence', 'uml'],
})

registerTool({
  id: 'usecase',
  name: '用例图',
  description: '用例图编辑器，支持参与者与用例',
  category: 'diagram',
  icon: 'Picture',
  route: '/diagram/usecase',
  component: () => import('./DiagramEditor.vue'),
  keywords: ['用例图', 'usecase', 'uml'],
})
