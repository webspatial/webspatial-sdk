import React from 'react'
import { createRoot } from 'react-dom/client'
import { Model } from '@webspatial/react-sdk/eager'
import { SpatialApp } from './spatial-app'

// Recommended eager-only shape: spatial is already in the bundle, so there
// is no dynamic boot step.

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')
createRoot(el).render(
  <React.StrictMode>
    <SpatialApp mode="eager-lean" Model={Model} />
  </React.StrictMode>,
)
