import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Supertokens from 'supertokens-web-js'
import EmailPassword from 'supertokens-web-js/recipe/emailpassword'
import Session from 'supertokens-web-js/recipe/session'
import { i18n } from './i18n'
import '@/index.css'

Supertokens.init({
  appInfo: {
    appName: import.meta.env.VITE_ST_APP_NAME,
    apiDomain: import.meta.env.VITE_ST_DOMAIN,
    apiBasePath: import.meta.env.VITE_ST_API_BASE_PATH,
  },
  recipeList: [
    EmailPassword.init(),
    Session.init({
      tokenTransferMethod: 'header',
    }),
  ],
})

const pinia = createPinia()

createApp(App)
  .use(router)
  .use(pinia)
  .use(i18n)
  .mount('#app')
