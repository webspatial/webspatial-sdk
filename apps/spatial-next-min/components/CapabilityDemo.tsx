'use client'

import { useEffect, useState } from 'react'
import {
  bootSpatial,
  Model,
  useSpatialReady,
  WebSpatialBootError,
} from '@webspatial/react-sdk'

// This page shows the recommended "application-side wrapper" pattern
// from the spec's "Component facades" + "User-side wrapper hook" notes.
// Instead of relying on the SDK's documented per-component facade
// fallback (which the spec pins as the SDK's contract), the app decides
// its own degraded UI by branching on `useSpatialReady()`.
//
// Concretely: on plain web (where `useSpatialReady()` stays `false` for
// the whole lifetime), the app renders a static poster image. In a
// WebSpatial runtime, after boot resolves and the hook flips to `true`,
// the app renders the real `<Model>`.
//
// This is what app teams should reach for when "facade fallback DOM" is
// not aesthetic enough for their product context.

export function CapabilityDemo() {
  const ready = useSpatialReady()

  useEffect(() => {
    bootSpatial().catch((err: unknown) => {
      if (err instanceof WebSpatialBootError) {
        // eslint-disable-next-line no-console
        console.error(
          '[spatial-next-min /capability-wrapper] bootSpatial rejected',
          err,
        )
      } else {
        throw err
      }
    })
  }, [])

  return (
    <section>
      <h1>Application-side capability wrapper</h1>
      <p>
        <code>useSpatialReady()</code> is the public hook that backs SDK
        facades. Apps can call it directly to render their own degraded UI on
        plain web (or while the spatial chunk loads in a WebSpatial runtime).
      </p>
      <p>
        useSpatialReady currently returns: <strong>{String(ready)}</strong>
      </p>

      <h2 style={{ marginTop: 24 }}>Branch on capability</h2>
      <p>
        On plain web: this app shows a static poster card. On AVP / PICO (after{' '}
        <code>bootSpatial()</code> resolves): the same slot mounts a real
        spatial <code>&lt;Model&gt;</code>.
      </p>
      {ready ? (
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
      ) : (
        <FlatPosterCard />
      )}
    </section>
  )
}

function FlatPosterCard() {
  return (
    <article
      style={{
        width: 320,
        height: 320,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        boxSizing: 'border-box',
        color: '#1e1b4b',
      }}
    >
      <strong style={{ fontSize: 18 }}>Spatial preview unavailable</strong>
      <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.4 }}>
        This product is best viewed in an Apple Vision Pro or PICO 4 Ultra
        WebSpatial-capable browser. On a flat browser we show this 2D card
        instead.
      </p>
    </article>
  )
}
