import React, { useCallback, useState } from 'react'

export type AppModelProps = {
  src?: string
  style?: React.CSSProperties
}

export type AppProps = {
  mode: 'lazy'
  Model: React.ComponentType<AppModelProps>
}

const cellStyle = {
  width: 96,
  height: 96,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 700,
  borderRadius: 8,
  background: '#334155',
  '--xr-back': '40',
  '--xr-background-material': 'thin',
} as React.CSSProperties

export function App({ mode, Model }: AppProps) {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onSpatialTap = useCallback(() => {
    setSpatialTapCount(count => count + 1)
  }, [])

  return (
    <main
      style={{
        padding: 32,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1f2937',
      }}
    >
      <nav
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <a href="/">Lazy default</a>
      </nav>

      <h1>WebSpatial Rspack Min ({mode})</h1>
      <p>
        This fixture validates Rspack resolution of{' '}
        <code>@webspatial/react-sdk</code>, the SDK JSX runtime, and dynamic
        spatial chunk splitting.
      </p>

      <section>
        <h2>SpatialDiv marker</h2>
        <div
          enable-xr
          onSpatialTap={onSpatialTap}
          style={{
            ...cellStyle,
            ...(spatialTapCount > 0
              ? { boxShadow: '0 0 0 3px rgb(34 197 94 / 0.85)' }
              : {}),
          }}
        >
          {spatialTapCount > 0 ? `Tap ${spatialTapCount}` : 'Tap'}
        </div>
      </section>

      <section>
        <h2>Model facade</h2>
        <Model
          enable-xr
          src="/modelasset/cone.usdz"
          style={{
            width: 280,
            height: 280,
            borderRadius: 12,
            background: '#e2e8f0',
          }}
        />
      </section>
    </main>
  )
}
