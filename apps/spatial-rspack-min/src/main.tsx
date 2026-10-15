import React from 'react'
import { createRoot } from 'react-dom/client'
import { Model, SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'
import { App } from './App'

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')

createRoot(el).render(
  <React.StrictMode>
    <SpatialBoot
      onError={(err: WebSpatialBootError) => {
        console.error('[spatial-rspack-min] bootSpatial rejected', err)
      }}
    >
      <App mode="lazy" Model={Model} />
    </SpatialBoot>
  </React.StrictMode>,
)
