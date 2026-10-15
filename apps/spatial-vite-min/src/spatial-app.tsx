import React, { useCallback, useState } from 'react'
import { FixtureNav } from './fixture-nav'

export type SpatialAppModelProps = {
  src?: string
  style?: React.CSSProperties
}

export type SpatialAppProps = {
  /**
   * Which fixture variant this page is.
   * - `lazy` — default package entry + real `bootSpatial()`.
   * - `eager-lean` — eager entry only; no `bootSpatial()` call (typical spatial-only app).
   */
  mode: 'lazy' | 'eager-lean'
  /** Real `Model` from either `@webspatial/react-sdk` or `@webspatial/react-sdk/eager`. */
  Model: React.ComponentType<SpatialAppModelProps>
  /** Lazy-only: minimal Reality scene graph (`@webspatial/react-sdk`). */
  RealityScene?: React.ComponentType
}

// `<div enable-xr>` is the documented JSX marker that the SDK's
// jsx-runtime (resolved via tsconfig "jsxImportSource") strips and
// wraps with `withSpatialized2DElementContainer('div')`. In a plain
// browser the wrapper renders the underlying div as-is; in an AVP /
// Pico / Puppeteer runtime, after spatial is ready, the real container
// mounts a native spatial-div slab respecting the `--xr-back` /
// `--xr-background-material` CSS custom properties.
const cellStyle = {
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

const fixtureTitles: Record<SpatialAppProps['mode'], string> = {
  lazy: 'Lazy default entry',
  'eager-lean': 'Eager entry, no bootSpatial()',
}

export function SpatialApp({ mode, Model, RealityScene }: SpatialAppProps) {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onFirstCellSpatialTap = useCallback(() => {
    setSpatialTapCount(c => c + 1)
  }, [])

  const entryImport =
    mode === 'lazy' ? '@webspatial/react-sdk' : '@webspatial/react-sdk/eager'

  return (
    <main
      style={{
        padding: 32,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#222',
      }}
    >
      <FixtureNav />
      <p style={{ marginBottom: 8 }}>
        <strong>Current:</strong> {fixtureTitles[mode]}
        {' — '}
        <code>{entryImport}</code>
      </p>

      <h1>WebSpatial Vite Min ({mode})</h1>
      <p>
        In a plain web browser the cells below render as flat divs and the{' '}
        <code>&lt;Model&gt;</code> renders the documented degraded{' '}
        <code>&lt;model&gt;</code> tag fallback. In the AVP simulator or PICO
        emulator (or under the Puppeteer test harness) they render as native
        spatial-div slabs floating in front of the page, respecting the{' '}
        <code>--xr-back</code> depth and <code>--xr-background-material</code>{' '}
        backplate styles, and the <code>&lt;Model&gt;</code> mounts the real
        spatial 3D model primitive.
      </p>

      <h2 style={{ marginTop: 32 }}>SpatialDiv grid</h2>
      <p style={{ marginBottom: 12, fontSize: 14 }}>
        Cell <strong>1</strong> uses <code>onSpatialTap</code> (
        <strong>{spatialTapCount}</strong>) — increments on spatial tap in a
        WebSpatial runtime.
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
                ...cellStyle,
                ...(i === 0 && spatialTapCount > 0
                  ? { boxShadow: '0 0 0 3px rgb(34 197 94 / 0.85)' }
                  : {}),
              } as React.CSSProperties
            }
          >
            {i === 0 && spatialTapCount > 0 ? `1 (${spatialTapCount})` : i + 1}
          </div>
        ))}
      </div>

      {mode === 'lazy' && RealityScene ? <RealityScene /> : null}

      <h2 style={{ marginTop: 32 }}>Model</h2>
      <p style={{ marginBottom: 16 }}>
        The <code>Model</code> facade strips spatial-only event props before
        reaching the host element, so this exact tree compiles cleanly in plain
        web (no spatial event handler is invoked) and upgrades to a real spatial
        primitive in the AVP runtime.
      </p>
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
    </main>
  )
}
