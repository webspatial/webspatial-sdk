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
 * Plain web / pre-boot: only the Reality facade's aria-hidden placeholder is in
 * the DOM — scene-graph children do not mount until boot.
 */
export function LazyRealitySceneBlock() {
  return (
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
  )
}

export function LazyRealityScene() {
  return (
    <>
      <h2 style={{ marginTop: 32 }}>Reality facade (scene graph)</h2>
      <p style={{ marginBottom: 12, fontSize: 14, maxWidth: 560 }}>
        Children must be scene-graph nodes (<code>UnlitMaterial</code>,{' '}
        <code>SceneGraph</code>, <code>Entity</code>, <code>*Entity</code>) —
        not the top-level <code>Model</code> facade. On plain web, inspect the
        DOM: one <code>&lt;div aria-hidden&gt;</code> box only; after boot in a
        WebSpatial runtime the box and entities appear.
      </p>
      <LazyRealitySceneBlock />
    </>
  )
}
