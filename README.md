# Instant Tools — Web 即时工具平台

纯前端 SPA 工具集合，所有功能在浏览器本地运行，无需后端，可静态部署。

## 功能模块

| 分类 | 工具 |
|------|------|
| 绘图 | 思维导图、时序图、用例图（可视化拖拽编辑器） |
| 配色 | 配色生成、颜色格式转换、调色与 WCAG 对比度检测 |
| 格式 | JSON 格式化、XML 格式化、JSON ↔ XML 互转 |
| 条码 | 二维码生成、条形码生成（CODE128 / EAN-13 等） |

## 技术栈

- Vue 3 + TypeScript + Vite
- Element Plus + Pinia + Vue Router
- @antv/x6（绘图）、Monaco Editor（代码编辑）
- colord、fast-xml-parser、qrcode、jsbarcode

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:5173

## 构建部署

```bash
npm run build
```

产物在 `dist/` 目录，可部署到 GitHub Pages、Vercel、Nginx 等任意静态托管。

## 扩展新工具

1. 在 `src/tools/` 下新建目录，创建 Vue 组件
2. 在目录的 `index.ts` 中调用 `registerTool()` 注册
3. 在 `src/tools/index.ts` 中 import 该目录

路由和侧边栏会自动更新。

```typescript
import { registerTool } from '@/core/registry'

registerTool({
  id: 'my-tool',
  name: '我的工具',
  description: '工具描述',
  category: 'custom',
  icon: 'Tools',
  route: '/custom/my-tool',
  component: () => import('./MyTool.vue'),
  keywords: ['关键词'],
})
```

## 项目结构

```
src/
├── core/           # 注册表、布局
├── shared/         # 公共组件与工具
├── tools/          # 各工具模块（可插拔）
├── views/          # 首页
├── router/
└── stores/
```
