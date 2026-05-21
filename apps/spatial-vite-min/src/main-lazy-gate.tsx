import React from 'react'
import { createRoot } from 'react-dom/client'
import { Model, SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'
import { LazyRealityScene } from './lazy-reality-scene'
import { SpatialApp } from './spatial-app'

function SpatialBootLoadingFallback() {
  return (
    <p
      style={{
        margin: 32,
        padding: 24,
        maxWidth: 480,
        borderRadius: 12,
        background: 'rgb(241 245 249)',
        border: '1px solid rgb(226 232 240)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      Loading spatial… (optional <code>fallback</code> while boot is in flight)
    </p>
  )
}

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')

createRoot(el).render(
  <React.StrictMode>
    <SpatialBoot
      fallback={<SpatialBootLoadingFallback />}
      onError={(err: WebSpatialBootError) => {
        console.error('[spatial-vite-min /lazy-gate] bootSpatial rejected', err)
      }}
    >
      <SpatialApp
        mode="lazy-gate"
        Model={Model}
        RealityScene={LazyRealityScene}
      />
    </SpatialBoot>
  </React.StrictMode>,
)
