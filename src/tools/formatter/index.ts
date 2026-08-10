import { registerTool } from '@/core/registry'

registerTool({
  id: 'json-formatter',
  name: 'JSON 格式化',
  description: 'JSON 美化、压缩与语法校验',
  category: 'formatter',
  icon: 'Document',
  route: '/formatter/json',
  component: () => import('./JsonFormatter.vue'),
  keywords: ['json', '格式化', '压缩', '校验'],
})

registerTool({
  id: 'xml-formatter',
  name: 'XML 格式化',
  description: 'XML 美化与压缩',
  category: 'formatter',
  icon: 'Document',
  route: '/formatter/xml',
  component: () => import('./XmlFormatter.vue'),
  keywords: ['xml', '格式化', '压缩'],
})

registerTool({
  id: 'json-xml-converter',
  name: 'JSON ↔ XML',
  description: 'JSON 与 XML 互相转换',
  category: 'formatter',
  icon: 'Document',
  route: '/formatter/json-xml',
  component: () => import('./JsonXmlConverter.vue'),
  keywords: ['json', 'xml', '转换'],
})
