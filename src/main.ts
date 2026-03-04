import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import '@/index.css'

// No SuperTokens SDK init needed — auth is handled manually via stAuthService

const pinia = createPinia()

createApp(App)
  .use(router)
  .use(pinia)
  .use(i18n)
  .mount('#app')
