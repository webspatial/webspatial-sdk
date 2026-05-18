'use client'

import { useEffect, useState } from 'react'
import {
  bootSpatial,
  Model,
  useSpatialReady,
  WebSpatialBootError,
} from '@webspatial/react-sdk'

// Why 'use client': this component imports facades (`Model`) and a hook
// (`useSpatialReady`) from the default entry. Per spec every facade file
// and every public-hook file carries `'use client'`, which means a
// Server Component CANNOT import them directly without crossing the
// boundary. This file IS the boundary — every spatial primitive lives
// inside a 'use client' subtree by construction.
//
// `<div enable-xr>` works because the workspace `tsconfig.json` sets
// `"jsxImportSource": "@webspatial/react-sdk"`, so SWC compiles JSX as
// `jsx(...)` calls against the SDK's JSX runtime. The runtime strips
// `enable-xr` and wraps the element with `withSpatialized2DElementContainer`
// on the client; during SSR (where the facades resolve to RSC Client
// References) the runtime safely degrades to "strip only" and the
// server-rendered DOM matches the post-hydration fallback DOM. See
// `packages/react/src/internal/facades-client.ts` for the RSC boundary
// design.
//
// Why boot in useEffect: in Next.js App Router the App is hydrated by
// the framework; we do not control `hydrateRoot`. The recommended
// pattern is therefore "boot AFTER hydrate" (spec tasks.md §13.5):
// hydration commits with `useSpatialReady() === false` (facade
// fallback HTML matches server-rendered HTML — no mismatch warning),
// then the post-hydrate `useEffect` calls `bootSpatial()`, the bridge
// flips, and a subsequent commit swaps facades to real implementations.

export function LazyDemo() {
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
          console.error('[spatial-next-min /lazy] bootSpatial rejected', err)
        } else {
          throw err
        }
      })
  }, [])

  return (
    <section>
      <h1>Lazy default entry</h1>
      <p>
        <code>
          import &#123; Model, bootSpatial, useSpatialReady &#125; from
          &apos;@webspatial/react-sdk&apos;
        </code>
      </p>
      <p>
        boot state: <strong>{bootState}</strong>, useSpatialReady:{' '}
        <strong>{ready ? 'true' : 'false'}</strong>
      </p>
      <p>
        On plain web both stay <code>false</code> / <code>idle→ready</code>{' '}
        (boot is a microtask no-op). In a WebSpatial runtime the boot promise
        resolves only after the spatial chunk lands.
      </p>

      <h2 style={{ marginTop: 24 }}>SpatialDiv grid</h2>
      <p>
        These <code>&lt;div enable-xr&gt;</code> elements are stripped and
        wrapped by the SDK&apos;s JSX runtime (configured via{' '}
        <code>tsconfig.jsxImportSource</code>). The marker disappears at compile
        time and the host element is wrapped with{' '}
        <code>withSpatialized2DElementContainer</code> on the client; the same
        JSX in a Server Component renders as a bare <code>&lt;div&gt;</code> via
        the RSC server-bypass path so the SSR HTML and the post-hydration
        fallback DOM stay in sync.
      </p>
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
                background: '#444',
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
      <p>
        The <code>&lt;Model&gt;</code> facade strips spatial-only event props on
        plain web and renders a degraded native <code>&lt;model&gt;</code> tag
        (per spec &quot;Model fallback&quot; Scenario). In a WebSpatial runtime,
        after boot resolves it swaps to the real spatial 3D primitive.
      </p>
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
