import { useCallback, useState } from 'react'
import {
  Model,
  SpatialBoot,
  useSpatialReady,
  WebSpatialBootError,
} from '@webspatial/react-sdk'
import { LazyRealityScene } from './LazyRealityScene'

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

function LazySpatialGateContent() {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onPanelSpatialTap = useCallback(() => {
    setSpatialTapCount(c => c + 1)
  }, [])
  const ready = useSpatialReady()

  return (
    <>
      <p>
        useSpatialReady: <strong>{ready ? 'true' : 'false'}</strong> (after gate
        opened)
      </p>

      <LazyRealityScene />

      <h2 style={{ marginTop: 24 }}>Model facade</h2>
      <Model
        enable-xr
        src="/modelasset/cone.usdz"
        style={{ width: 200, height: 120 }}
      />

      <h2 style={{ marginTop: 24 }}>SpatialDiv (`enable-xr`)</h2>
      <figure
        style={{
          margin: '16px 0 0',
          padding: 14,
          maxWidth: 360,
          borderRadius: 12,
          border: '1px solid rgb(226 232 240)',
          background:
            'linear-gradient(155deg, rgb(248 250 252) 0%, rgb(226 232 240 / 0.65) 100%)',
        }}
      >
        <figcaption style={{ fontSize: 13, marginBottom: 10 }}>
          <code>onSpatialTap</code> count: <strong>{spatialTapCount}</strong>
        </figcaption>
        <div
          enable-xr
          role="presentation"
          onSpatialTap={onPanelSpatialTap}
          style={{
            '--xr-back': '40',
            '--xr-background-material': 'thin',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 72,
            padding: '0 12px',
            borderRadius: 8,
            background: 'rgb(241 245 249)',
            ...(spatialTapCount > 0
              ? { outline: '3px solid rgb(34 197 94 / 0.75)' }
              : {}),
          }}
        >
          Spatial panel
          {spatialTapCount > 0 ? ` — taps: ${spatialTapCount}` : ''}
        </div>
      </figure>
    </>
  )
}

/**
 * Lazy entry with `<SpatialBoot gate>` — children mount only after boot.
 */
export function LazySpatialGateDemo() {
  return (
    <section style={{ maxWidth: 720 }}>
      <h1>SpatialBoot gate (`@webspatial/react-sdk`)</h1>
      <p>
        <code>
          import &#123; SpatialBoot, Model, useSpatialReady &#125; from
          &apos;@webspatial/react-sdk&apos;
        </code>
      </p>
      <p>
        The heading above stays visible during boot. Spatial primitives below
        are inside <code>&lt;SpatialBoot gate fallback=&#123;…&#125;&gt;</code>.
      </p>

      <SpatialBoot
        gate
        fallback={<SpatialBootGateFallback />}
        onError={(err: WebSpatialBootError) => {
          console.error(
            '[spatial-remix-min /lazy-gate] bootSpatial rejected',
            err,
          )
        }}
      >
        <LazySpatialGateContent />
      </SpatialBoot>
    </section>
  )
}
