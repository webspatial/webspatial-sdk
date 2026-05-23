'use client'

import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import { Model } from '@webspatial/react-sdk/eager'

// Eager entry: spatial is statically linked when this module evaluates
// (`import './spatial'` + bridge preload). Render `<Model />` / `enable-xr`
// markers directly — no `bootSpatial()` or `useSpatialReady()` required.
//
// `bootSpatial`, `useSpatialReady`, and `<SpatialBoot>` still exist on the
// eager entry as no-op compatibility stubs for lazy → eager migration
// (change the import root only). This demo omits them on purpose.
//
// Compare with `/lazy`: open Network — eager has no separate spatial chunk
// fetch on first navigation.

export function EagerDemo() {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onFirstCellSpatialTap = useCallback(() => {
    setSpatialTapCount(c => c + 1)
  }, [])

  return (
    <section>
      <h1>Eager entry</h1>
      <p>
        <code>
          import &#123; Model &#125; from
          &apos;@webspatial/react-sdk/eager&apos;
        </code>
      </p>
      <p>
        Spatial primitives mount immediately — the real implementation is in
        this page&apos;s first JS payload, not behind{' '}
        <code>await bootSpatial()</code>. Use this entry for spatial-only apps;
        use the default entry when you need SSR façade HTML or the 8&nbsp;KB
        lazy sync budget.
      </p>

      <h2 style={{ marginTop: 24 }}>SpatialDiv grid</h2>
      <p style={{ marginBottom: 8, fontSize: 14 }}>
        Cell <strong>1</strong> listens for <code>onSpatialTap</code> (
        <strong>{spatialTapCount}</strong>) — increments when the slab is
        spatially tapped (WebSpatial runtime).
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
                background: '#206',
                '--xr-back': '40',
                '--xr-background-material': 'thin',
                ...(i === 0 && spatialTapCount > 0
                  ? { boxShadow: '0 0 0 3px rgb(251 191 36 / 0.95)' }
                  : {}),
              } as CSSProperties
            }
          >
            {i === 0 && spatialTapCount > 0 ? `1 (${spatialTapCount})` : i + 1}
          </div>
        ))}
      </div>

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
    </section>
  )
}
