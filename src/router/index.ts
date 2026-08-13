import '@/tools'
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/core/layout/AppLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ControlView from '@/views/ControlView.vue'
import { getToolById, getTools } from '@/core/registry'
import { useAppStore } from '@/stores/app'
import { useAnalyticsStore } from '@/stores/analytics'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        ...getTools().map((tool) => ({
          path: tool.route.replace(/^\//, ''),
          name: tool.id,
          component: tool.component,
          meta: { toolId: tool.id },
        })),
        {
          path: 'control',
          name: 'control',
          component: ControlView,
        },
      ],
    },
  ],
})

router.afterEach((to, from) => {
  const analytics = useAnalyticsStore()

  if (from.meta.toolId) {
    analytics.trackLeave()
  }

  const toolId = to.meta.toolId as string | undefined
  if (toolId) {
    const tool = getToolById(toolId)
    if (tool) {
      useAppStore().addRecentTool(tool)
    }
    analytics.trackEnter(toolId)
  }
})

export default router
