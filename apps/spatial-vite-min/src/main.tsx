import React from 'react'
import { createRoot } from 'react-dom/client'
import { bootSpatial, WebSpatialBootError } from '@webspatial/react-sdk'
import App from './App'

// `bootSpatial()` resolves immediately in plain web browsers (no spatial
// chunk fetch); in WebSpatial-capable runtimes it dynamically loads the
// spatial chunk so facades can swap to their real implementations on
// the first render commit. A rejected `WebSpatialBootError` is logged
// and the React tree mounts in fallback mode anyway — per spec, the
// facade fallback IS the user's degraded display path.
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
      <App />
    </React.StrictMode>,
  )
}

void start()
