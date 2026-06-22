'use client'

import {
  BoxEntity,
  Entity,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'

const LAZY_DEMO_MAT = 'lazyDemoMat'

/**
 * Minimal Reality scene graph (same shape as apps/test-server reality demos).
 */
export function LazyRealityScene() {
  return (
    <>
      <h2 style={{ marginTop: 24 }}>Reality facade (scene graph)</h2>
      <p style={{ marginBottom: 12, fontSize: 14 }}>
        Children are scene-graph nodes only (not the top-level{' '}
        <code>Model</code> facade). Plain web / SSR first paint: one{' '}
        <code>aria-hidden</code> placeholder; scene children mount after{' '}
        <code>bootSpatial()</code> in a WebSpatial runtime.
      </p>
      <Reality
        style={{
          width: '100%',
          maxWidth: 360,
          height: 220,
          border: '1px dashed rgb(148 163 184)',
          background: 'rgb(248 250 252)',
          '--xr-depth': 100,
          '--xr-back': 80,
        }}
      >
        <UnlitMaterial id={LAZY_DEMO_MAT} color="#94a3b8" />
        <SceneGraph>
          <Entity>
            <BoxEntity
              width={0.12}
              height={0.12}
              depth={0.12}
              materials={[LAZY_DEMO_MAT]}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </>
  )
}
