'use client'

import { useEffect, useState } from 'react'
import {
  bootSpatial,
  Model,
  useSpatialReady,
  WebSpatialBootError,
} from '@webspatial/react-sdk/eager'

// Same source shape as `LazyDemo.tsx` — only the import root flips from
// `@webspatial/react-sdk` to `@webspatial/react-sdk/eager`. This is the
// migration story spec pins as "Migration from default to eager is
// import-root-only" Scenario.
//
// Runtime differences (vs lazy):
//
//  - `bootSpatial()` is a no-op stub that resolves on the next microtask
//    (spec "Eager bootSpatial is a no-op stub" Scenario). We still await
//    it so this file mirrors `LazyDemo.tsx` byte-for-byte modulo the
//    import root, making the migration story visible.
//  - `useSpatialReady()` returns `true` on the first render in a
//    WebSpatial runtime (eager preloads the bridge at module-evaluation
//    time via `__internalSetSpatialImpl`). On plain web `useSpatialReady`
//    still returns `false`.
//  - The full spatial implementation is in this page's main bundle.
//    Open the Network panel: there is NO separate `chunk-XXXX.js`
//    fetch on first navigation, unlike `/lazy`.

export function EagerDemo() {
  const [bootState, setBootState] = useState<
    'idle' | 'booting' | 'ready' | 'failed'
  >('idle')
  const ready = useSpatialReady()

  useEffect(() => {
    setBootState('booting')
    bootSpatial()
      .then(() => setBootState('ready'))
      .catch((err: unknown) => {
        setBootState('failed')
        if (err instanceof WebSpatialBootError) {
          // eslint-disable-next-line no-console
          console.error('[spatial-next-min /eager] bootSpatial rejected', err)
        } else {
          throw err
        }
      })
  }, [])

  return (
    <section>
      <h1>Eager entry</h1>
      <p>
        <code>
          import &#123; Model, bootSpatial, useSpatialReady &#125; from
          &apos;@webspatial/react-sdk/eager&apos;
        </code>
      </p>
      <p>
        boot state: <strong>{bootState}</strong>, useSpatialReady:{' '}
        <strong>{ready ? 'true' : 'false'}</strong>
      </p>
      <p>
        On plain web the eager entry behaves visually like the lazy entry (same
        facade fallback). The trade-off is that the spatial implementation is in
        the first JS payload, not behind a dynamic import — appropriate for
        spatial-only consumers.
      </p>

      <h2 style={{ marginTop: 24 }}>SpatialDiv grid</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 100px)',
          gap: 16,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            enable-xr
            style={
              {
                width: 100,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                borderRadius: 8,
                background: '#206',
                '--xr-back': '40',
                '--xr-background-material': 'thin',
              } as React.CSSProperties
            }
          >
            {i + 1}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Model</h2>
      <Model
        src="/scene.usdz"
        style={{
          width: 320,
          height: 320,
          borderRadius: 12,
          background: '#ddd',
        }}
      />
    </section>
  )
}
