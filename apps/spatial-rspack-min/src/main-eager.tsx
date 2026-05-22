import React from 'react'
import { createRoot } from 'react-dom/client'
import { Model, SpatialBoot } from '@webspatial/react-sdk/eager'
import { App } from './App'

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')

createRoot(el).render(
  <React.StrictMode>
    <SpatialBoot>
      <App mode="eager" Model={Model} />
    </SpatialBoot>
  </React.StrictMode>,
)
