import React from 'react'
import { createRoot } from 'react-dom/client'
import { Model, SpatialBoot } from '@webspatial/react-sdk/eager'
import { SpatialApp } from './spatial-app'

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')

createRoot(el).render(
  <React.StrictMode>
    <SpatialBoot>
      <SpatialApp mode="eager-boot" Model={Model} />
    </SpatialBoot>
  </React.StrictMode>,
)
