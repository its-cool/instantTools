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
    include: ['@antv/x6', 'monaco-editor', 'element-plus'],
    entries: [
      './src/main.ts',
      './src/views/**/*.vue',
      './src/core/**/*.vue',
      './src/tools/**/*.vue',
      './src/shared/**/*.vue',
    ],
  },
})
