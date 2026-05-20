import React from 'react'
import { createRoot } from 'react-dom/client'
import { Model, SpatialBoot } from '@webspatial/react-sdk'
import { LazyRealityScene } from './lazy-reality-scene'
import { SpatialApp } from './spatial-app'

function SpatialBootGateFallback() {
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
      Loading spatial… (<code>SpatialBoot gate</code> — children mount after{' '}
      <code>bootSpatial()</code> resolves)
    </p>
  )
}

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')

createRoot(el).render(
  <React.StrictMode>
    <SpatialBoot gate fallback={<SpatialBootGateFallback />}>
      <SpatialApp
        mode="lazy-gate"
        Model={Model}
        RealityScene={LazyRealityScene}
      />
    </SpatialBoot>
  </React.StrictMode>,
)
