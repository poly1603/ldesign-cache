import React from 'react'
import ReactDOM from 'react-dom/client'
import { CacheProvider } from '@ldesign/cache-react'
import { createCache } from '@ldesign/cache-core'
import App from './App'
import './style.css'

const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 60 * 1000,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider cache={cache}>
      <App />
    </CacheProvider>
  </React.StrictMode>,
)


