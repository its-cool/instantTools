import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const require = createRequire(import.meta.url)
const monacoEditorPlugin = require('vite-plugin-monaco-editor')

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
    monacoEditorPlugin.default({}),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/element-plus')) return 'element-plus'
          if (id.includes('node_modules/monaco-editor')) return 'monaco'
          if (id.includes('node_modules/@antv/x6')) return 'x6'
        },
      },
    },
  },
  optimizeDeps: {
    // 预构建所有被懒加载工具页动态 import 的重型依赖，
    // 避免首次导航时 Vite 临时优化依赖并触发整页刷新导致闪回首页。
    include: [
      '@antv/x6',
      '@antv/x6-vue-shape',
      'monaco-editor',
      'element-plus',
      'proj4',
      'gcoord',
      'xlsx',
      'fast-xml-parser',
      'jsbarcode',
      'qrcode',
      'colord',
      'localforage',
      '@ant-design/colors',
      'file-saver',
    ],
    entries: [
      './src/main.ts',
      './src/views/**/*.vue',
      './src/core/**/*.vue',
      './src/tools/**/*.vue',
      './src/shared/**/*.vue',
    ],
  },
})
