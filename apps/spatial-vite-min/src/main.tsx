import React from 'react'
import { createRoot } from 'react-dom/client'
import { Model, SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'
import { LazyRealityScene } from './lazy-reality-scene'
import { SpatialApp } from './spatial-app'

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')

createRoot(el).render(
  <React.StrictMode>
    <SpatialBoot
      onError={(err: WebSpatialBootError) => {
        console.error('[spatial-vite-min] bootSpatial rejected', err)
      }}
    >
      <SpatialApp mode="lazy" Model={Model} RealityScene={LazyRealityScene} />
    </SpatialBoot>
  </React.StrictMode>,
)
