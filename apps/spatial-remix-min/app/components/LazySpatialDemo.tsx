import { useCallback, useEffect, useState } from 'react'
import {
  bootSpatial,
  Model,
  useSpatialReady,
  WebSpatialBootError,
} from '@webspatial/react-sdk'

/**
 * Client subtree for `@webspatial/react-sdk` (lazy default entry).
 * Boot runs after mount (recommended “boot after hydrate” pattern).
 */
export function LazySpatialDemo() {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onPanelSpatialTap = useCallback(() => {
    setSpatialTapCount(c => c + 1)
  }, [])

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
          console.error('[spatial-remix-min /lazy] bootSpatial rejected', err)
        } else {
          throw err
        }
      })
  }, [])

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Lazy default entry (`@webspatial/react-sdk`)</h1>
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
        On plain web, boot resolves quickly and the facade fallback stays. In a
        WebSpatial runtime the spatial chunk loads after{' '}
        <code>bootSpatial()</code>.
      </p>

      <h2 style={{ marginTop: 24 }}>Model facade</h2>
      <Model
        enable-xr
        src="/modelasset/cone.usdz"
        style={{ width: 200, height: 120 }}
      />

      <h2 style={{ marginTop: 24 }}>SpatialDiv (`enable-xr`)</h2>
      <p>
        Requires <code>tsconfig.json</code>{' '}
        <code>
          &quot;jsxImportSource&quot;: &quot;@webspatial/react-sdk&quot;
        </code>
        .
      </p>
      <figure
        style={{
          margin: '16px 0 0',
          padding: 14,
          maxWidth: 360,
          borderRadius: 12,
          border: '1px solid rgb(226 232 240)',
          background:
            'linear-gradient(155deg, rgb(248 250 252) 0%, rgb(226 232 240 / 0.65) 100%)',
          boxShadow:
            '0 12px 28px rgb(15 23 42 / 0.08), 0 2px 6px rgb(15 23 42 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.9)',
        }}
      >
        <figcaption
          style={{
            fontSize: 13,
            lineHeight: 1.45,
            color: 'rgb(51 65 85)',
            marginBottom: 10,
          }}
        >
          The JSX runtime strips <code>enable-xr</code> from the emitted DOM,
          wraps this host with the spatial 2D container in client bundles, and
          keeps SSR/hydrate markup aligned with facade fallbacks.{' '}
          <code>onSpatialTap</code> count: <strong>{spatialTapCount}</strong>{' '}
          (WebSpatial runtime).
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
            width: '100%',
            padding: '0 12px',
            borderRadius: 8,
            background:
              'linear-gradient(180deg, rgb(241 245 249) 0%, rgb(226 232 240) 100%)',
            color: 'rgb(71 85 105)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.02em',
            boxShadow:
              'inset 0 2px 4px rgb(15 23 42 / 0.06), 0 1px 0 rgb(255 255 255 / 0.85)',
            ...(spatialTapCount > 0
              ? { outline: '3px solid rgb(34 197 94 / 0.75)' }
              : {}),
          }}
        >
          Spatial panel (plain web fallback)
          {spatialTapCount > 0 ? ` — taps: ${spatialTapCount}` : ''}
        </div>
      </figure>
    </section>
  )
}
