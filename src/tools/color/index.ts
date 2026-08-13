import { registerTool } from '@/core/registry'

registerTool({
  id: 'color-palette',
  name: '配色生成',
  description: '一键生成 analogous、互补、三角等配色方案',
  category: 'color',
  icon: 'Brush',
  route: '/color/palette',
  component: () => import('./ColorPalette.vue'),
  keywords: ['配色', 'palette', '色板', '生成'],
})

registerTool({
  id: 'color-converter',
  name: '颜色转换',
  description: 'HEX / RGB / HSL / CMYK 格式互转',
  category: 'color',
  icon: 'Brush',
  route: '/color/converter',
  component: () => import('./ColorConverter.vue'),
  keywords: ['颜色', 'hex', 'rgb', 'hsl', '转换'],
})

registerTool({
  id: 'color-picker',
  name: '调色与对比度',
  description: 'HSL 调色与 WCAG 对比度检测',
  category: 'color',
  icon: 'Brush',
  route: '/color/picker',
  component: () => import('./ColorPickerTool.vue'),
  keywords: ['调色', '对比度', 'wcag', 'hsl'],
})

registerTool({
  id: 'color-theme',
  name: 'Web 主题配色',
  description: '输入基础色生成 Element Plus / Tailwind / Material 等多套主题方案',
  category: 'color',
  icon: 'Brush',
  route: '/color/theme',
  component: () => import('./ColorTheme.vue'),
  keywords: ['主题', 'theme', '配色', 'element', 'tailwind', 'material', 'ant', 'bootstrap', 'css变量'],
})
