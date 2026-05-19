'use client'

import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Model,
  SpatialBoot,
  useSpatialReady,
  WebSpatialBootError,
} from '@webspatial/react-sdk'

function SpatialBootGateFallback() {
  return (
    <p
      style={{
        margin: '24px 0',
        padding: 20,
        borderRadius: 12,
        background: 'rgb(241 245 249)',
        border: '1px solid rgb(226 232 240)',
      }}
    >
      Loading spatial… (<code>SpatialBoot gate</code>)
    </p>
  )
}

function LazyGateContent() {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onFirstCellSpatialTap = useCallback(() => {
    setSpatialTapCount(c => c + 1)
  }, [])
  const ready = useSpatialReady()

  return (
    <>
      <p>
        useSpatialReady: <strong>{ready ? 'true' : 'false'}</strong> (after gate
        opened)
      </p>

      <h2 style={{ marginTop: 24 }}>SpatialDiv grid</h2>
      <p style={{ fontSize: 14 }}>
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

export function LazyGateDemo() {
  return (
    <section>
      <h1>SpatialBoot gate</h1>
      <p>
        <code>
          import &#123; SpatialBoot, Model, useSpatialReady &#125; from
          &apos;@webspatial/react-sdk&apos;
        </code>
      </p>
      <p>
        Same lazy entry as <code>/lazy</code>, but spatial UI is behind{' '}
        <code>
          &lt;SpatialBoot gate fallback=&#123;…&#125;&gt;
        </code>
        . On WebSpatial runtimes you may briefly see the loading fallback before
        this subtree mounts.
      </p>

      <SpatialBoot
        gate
        fallback={<SpatialBootGateFallback />}
        onError={(err: WebSpatialBootError) => {
          // eslint-disable-next-line no-console
          console.error('[spatial-next-min /lazy-gate] bootSpatial rejected', err)
        }}
      >
        <LazyGateContent />
      </SpatialBoot>
    </section>
  )
}
