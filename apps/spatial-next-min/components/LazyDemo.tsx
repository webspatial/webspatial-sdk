'use client'

import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import { Model, SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'
import { LazyRealityScene } from '@/components/LazyRealityScene'

// Why 'use client': facades and hooks from the default entry require a client
// boundary. Server pages import this module only.
//
// Phase-1 integration: wrap spatial UI in `<SpatialBoot>`. Boot runs after
// mount; children mount only after `bootSpatial()` succeeds. On failure,
// `onError` runs and children stay unmounted — handle UX in `onError` (toast,
// error page, retry via `bootSpatial()`).

function LazyDemoContent() {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onFirstCellSpatialTap = useCallback(() => {
    setSpatialTapCount(c => c + 1)
  }, [])

  return (
    <>
      <p>
        This subtree mounts after <code>SpatialBoot</code> resolves. On plain
        web boot resolves quickly; in a WebSpatial runtime the spatial chunk
        must load before this content appears.
      </p>

      <h2 style={{ marginTop: 24 }}>SpatialDiv grid</h2>
      <p>
        These <code>&lt;div enable-xr&gt;</code> elements use the SDK JSX
        runtime (<code>tsconfig.jsxImportSource</code>). Cell <strong>1</strong>{' '}
        uses <code>onSpatialTap</code> (counter below).
      </p>
      <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
        <code>onSpatialTap</code> count (cell 1):{' '}
        <strong>{spatialTapCount}</strong>
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
            {...(i === 0 ? { onSpatialTap: onFirstCellSpatialTap } : {})}
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
                ...(i === 0 && spatialTapCount > 0
                  ? { boxShadow: '0 0 0 3px rgb(34 197 94 / 0.85)' }
                  : {}),
              } as CSSProperties
            }
          >
            {i === 0 && spatialTapCount > 0 ? `1 (${spatialTapCount})` : i + 1}
          </div>
        ))}
      </div>

      <LazyRealityScene />

      <h2 style={{ marginTop: 32 }}>Model</h2>
      <Model
        enable-xr
        src="/modelasset/cone.usdz"
        style={{
          width: 320,
          height: 320,
          borderRadius: 12,
          background: '#ddd',
        }}
      />
    </>
  )
}

export function LazyDemo() {
  return (
    <section>
      <h1>Lazy default entry</h1>
      <p>
        <code>
          import &#123; SpatialBoot, Model, useSpatialReady &#125; from
          &apos;@webspatial/react-sdk&apos;
        </code>
      </p>

      <SpatialBoot
        onError={(err: WebSpatialBootError) => {
          // eslint-disable-next-line no-console
          console.error('[spatial-next-min /lazy] bootSpatial rejected', err)
        }}
      >
        <LazyDemoContent />
      </SpatialBoot>
    </section>
  )
}
