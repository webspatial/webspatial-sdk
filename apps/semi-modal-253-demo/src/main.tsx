import { SpatialBoot } from '@webspatial/react-sdk'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '@douyinfe/semi-ui/dist/css/semi.min.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <SpatialBoot>
      <App />
    </SpatialBoot>
  </React.StrictMode>,
)
