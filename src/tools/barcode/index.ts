import { registerTool } from '@/core/registry'

registerTool({
  id: 'qrcode-generator',
  name: '二维码生成',
  description: '生成二维码，支持尺寸、容错级别、颜色配置',
  category: 'barcode',
  icon: 'DataAnalysis',
  route: '/barcode/qrcode',
  component: () => import('./QrCodeGenerator.vue'),
  keywords: ['二维码', 'qrcode', 'qr'],
})

registerTool({
  id: 'barcode-generator',
  name: '条形码生成',
  description: '生成 CODE128、EAN-13 等条形码',
  category: 'barcode',
  icon: 'DataAnalysis',
  route: '/barcode/barcode',
  component: () => import('./BarcodeGenerator.vue'),
  keywords: ['条形码', 'barcode', 'code128', 'ean'],
})
