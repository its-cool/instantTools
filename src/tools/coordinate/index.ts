import { registerTool } from '@/core/registry'

registerTool({
  id: 'coordinate-converter',
  name: '坐标转换',
  description: 'WGS84 / GCJ02 / BD09 坐标系互转，支持批量与 Excel 导入',
  category: 'coordinate',
  icon: 'Location',
  route: '/coordinate/converter',
  component: () => import('./CoordinateConverter.vue'),
  keywords: ['坐标', '转换', 'wgs84', 'gcj02', 'bd09', '火星', '百度', 'gps', '经纬度'],
})
