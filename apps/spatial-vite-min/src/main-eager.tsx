import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  bootSpatial,
  Model,
  WebSpatialBootError,
} from '@webspatial/react-sdk/eager'
import { SpatialApp } from './spatial-app'

// Eager entry: spatial implementation is statically linked. `bootSpatial()`
// is a documented no-op (dev-only warning) but we still await it here so this
// file mirrors `main.tsx` and copy-paste migrations stay obvious.
async function start(): Promise<void> {
  try {
    await bootSpatial()
  } catch (err) {
    if (err instanceof WebSpatialBootError) {
      console.error(
        '[spatial-vite-min eager] bootSpatial() rejected; rendering with web fallback',
        err,
      )
    } else {
      throw err
    }
  }

  const el = document.getElementById('root')
  if (!el) throw new Error('#root not found')
  createRoot(el).render(
    <React.StrictMode>
      <SpatialApp mode="eager" Model={Model} />
    </React.StrictMode>,
  )
}

void start()
