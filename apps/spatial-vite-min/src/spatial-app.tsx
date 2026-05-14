import React from 'react'

export type SpatialAppModelProps = {
  src?: string
  style?: React.CSSProperties
}

export type SpatialAppProps = {
  /** Which SDK entry this page was bundled from (lazy default vs eager). */
  mode: 'lazy' | 'eager'
  /** Real `Model` from either `@webspatial/react-sdk` or `@webspatial/react-sdk/eager`. */
  Model: React.ComponentType<SpatialAppModelProps>
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

export function SpatialApp({ mode, Model }: SpatialAppProps) {
  const otherHref = mode === 'lazy' ? '/eager.html' : '/'
  const otherLabel =
    mode === 'lazy' ? 'Open eager entry fixture' : 'Open lazy entry fixture'

  return (
    <main
      style={{
        padding: 32,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#222',
      }}
    >
      <p style={{ marginBottom: 16 }}>
        <a href={otherHref}>{otherLabel}</a>
        {' · '}
        <span>
          Entry:{' '}
          <code>
            {mode === 'lazy'
              ? '@webspatial/react-sdk'
              : '@webspatial/react-sdk/eager'}
          </code>
        </span>
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 100px)',
          gap: 16,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} enable-xr style={cellStyle}>
            {i + 1}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Model</h2>
      <p style={{ marginBottom: 16 }}>
        The <code>Model</code> facade strips spatial-only event props before
        reaching the host element, so this exact tree compiles cleanly in plain
        web (no spatial event handler is invoked) and upgrades to a real spatial
        primitive in the AVP runtime.
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
    </main>
  )
}
