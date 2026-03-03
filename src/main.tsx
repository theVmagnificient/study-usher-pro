import React from 'react'
import ReactDOM from 'react-dom/client'
import Supertokens from 'supertokens-web-js'
import EmailPassword from 'supertokens-web-js/recipe/emailpassword'
import Session from 'supertokens-web-js/recipe/session'
import './i18n'
import App from './App'
import '@/index.css'

Supertokens.init({
  appInfo: {
    appName: import.meta.env.VITE_ST_APP_NAME,
    apiDomain: import.meta.env.VITE_ST_DOMAIN,
    apiBasePath: import.meta.env.VITE_ST_API_BASE_PATH,
  },
  recipeList: [EmailPassword.init(), Session.init({
    tokenTransferMethod: 'header',
    sessionTokenBackendDomain: import.meta.env.VITE_ST_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
    override: {
      functions: (originalImplementation) => ({
        ...originalImplementation,
        shouldDoInterceptionBasedOnUrl: () => false,
      }),
    },
  })],
})

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
