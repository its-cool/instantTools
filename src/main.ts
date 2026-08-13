import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/tools'
import App from './App.vue'
import router from './router'
import { useAppStore } from '@/stores/app'
import { useAnalyticsStore } from '@/stores/analytics'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

const appStore = useAppStore()
void appStore.init()

const analyticsStore = useAnalyticsStore()
void analyticsStore.init()

app.mount('#app')
