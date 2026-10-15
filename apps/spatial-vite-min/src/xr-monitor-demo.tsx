import React, { useState } from 'react'
import { FixtureNav } from './fixture-nav'
import { LazyRealitySceneBlock } from './lazy-reality-scene'

const panelStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#f8fafc',
  color: '#0f172a',
  boxSizing: 'border-box',
}

const cellStyle = {
  width: 72,
  height: 72,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 700,
  borderRadius: 8,
  background: '#475569',
  '--xr-back': '48',
  '--xr-background-material': 'thin',
} as React.CSSProperties

/**
 * `enable-xr-monitor` + nested `enable-xr` cells. Toggles must change **layout
 * box** (mount/unmount, height, width) — not visibility/opacity alone — so the
 * grid below shifts in the document and spatial-div slabs re-sync in WebSpatial.
 */
export function XrMonitorDemo() {
  const [layoutBlockOpen, setLayoutBlockOpen] = useState(true)
  const [narrowBlock, setNarrowBlock] = useState(false)

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
        <strong>Current:</strong> Lazy default entry —{' '}
        <code>enable-xr-monitor</code> + <code>enable-xr</code> +{' '}
        <code>Reality</code> demo
      </p>

      <h1>WebSpatial Vite Min — enable-xr-monitor</h1>
      <p>
        Outer host: <code>&lt;div enable-xr-monitor&gt;</code>. Nested cells:{' '}
        <code>enable-xr</code> (spatial-div slabs after{' '}
        <code>bootSpatial()</code>
        ). The monitor watches subtree <strong>layout</strong> changes (
        <code>childList</code>, <code>style</code>, <code>class</code>) and
        notifies slabs to re-sync. Use the buttons below — they insert/remove or
        resize a block so the <strong>grid moves in the page</strong> (plain
        web) slabs should follow (WebSpatial). A nested <code>Reality</code>{' '}
        host moves with the same reflow (whole 3D viewport), but does not use
        the monitor → slab sync path — compare it to cells <strong>1–6</strong>.
      </p>
      <p style={{ fontSize: 14, color: '#b45309', marginTop: 8 }}>
        <strong>Note:</strong> <code>visibility: hidden</code> / opacity-only
        changes do not change layout size; this demo avoids them on purpose.
      </p>

      <div
        enable-xr-monitor
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          border: '2px solid #334155',
          background: '#e2e8f0',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setLayoutBlockOpen(v => !v)}
            style={{ marginRight: 8, marginBottom: 8 }}
          >
            {layoutBlockOpen ? 'Remove layout block' : 'Insert layout block'}
          </button>
          <button
            type="button"
            disabled={!layoutBlockOpen}
            onClick={() => setNarrowBlock(v => !v)}
            style={{ marginBottom: 8 }}
          >
            {narrowBlock ? 'Full-width block' : 'Narrow block (35% width)'}
          </button>
        </div>

        {layoutBlockOpen ? (
          <div
            style={{
              ...panelStyle,
              marginBottom: 20,
              minHeight: 160,
              width: narrowBlock ? '35%' : '100%',
              transition: 'width 0.2s ease',
            }}
          >
            <strong>Layout block</strong> — {narrowBlock ? '35%' : '100%'}{' '}
            width, 160px min-height. Removing this block moves the numbered grid
            up; narrowing shifts it horizontally.
          </div>
        ) : (
          <p
            style={{
              marginBottom: 20,
              fontSize: 14,
              fontStyle: 'italic',
              color: '#64748b',
            }}
          >
            Layout block removed — compare grid position with block inserted.
          </p>
        )}

        <h2 style={{ fontSize: 16, marginBottom: 4 }}>
          SpatialDiv grid (enable-xr)
        </h2>
        <p style={{ marginBottom: 12, fontSize: 14 }}>
          Watch cells <strong>1–6</strong>: in plain web they jump when the
          block toggles; in AVP/PICO the floating slabs should move to match.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 72px)',
            gap: 12,
            paddingTop: 8,
            borderTop: '2px dashed #94a3b8',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} enable-xr style={cellStyle}>
              {i + 1}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 4 }}>
          Reality (scene graph, inside monitor)
        </h2>
        <p style={{ marginBottom: 12, fontSize: 14 }}>
          Plain web: dashed placeholder <code>&lt;div&gt;</code> jumps with the
          block toggle. WebSpatial: the whole 3D panel should move with that
          host — not per-entity monitor sync.
        </p>
        <LazyRealitySceneBlock />
      </div>
    </main>
  )
}
