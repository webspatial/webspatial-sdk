import React from 'react'
import { createRoot } from 'react-dom/client'
import { bootSpatial, WebSpatialBootError } from '@webspatial/react-sdk'
import { XrMonitorDemo } from './xr-monitor-demo'

async function start(): Promise<void> {
  try {
    await bootSpatial()
  } catch (err) {
    if (err instanceof WebSpatialBootError) {
      console.error(
        '[spatial-vite-min] bootSpatial() rejected; rendering with web fallback',
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
      <XrMonitorDemo />
    </React.StrictMode>,
  )
}

void start()
