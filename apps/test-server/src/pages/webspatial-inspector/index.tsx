import {
  BoxEntity,
  Entity,
  Model,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import { WebSpatialInspector } from '@webspatial/react-sdk/experimental'
import { useState } from 'react'

export default function WebSpatialInspectorPage() {
  const [showInspector, setShowInspector] = useState(true)
  const [showEntity, setShowEntity] = useState(true)

  return (
    <div className="min-h-screen bg-[#0b1014] p-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-end justify-between gap-6 border-b border-slate-700 pb-6">
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
              Native scene diagnostics
            </div>
            <h1 className="text-3xl font-semibold">WebSpatial Inspector</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Open the Ornament inspector, select a native node, and verify that
              DOM-backed SpatialDiv, Model, and Reality placeholders are
              highlighted on this page.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-md border border-cyan-700 bg-cyan-950 px-4 py-2 font-mono text-xs text-cyan-200"
              onClick={() => setShowInspector(value => !value)}
            >
              {showInspector ? 'Close inspector' : 'Open inspector'}
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 font-mono text-xs text-slate-200"
              onClick={() => setShowEntity(value => !value)}
            >
              {showEntity ? 'Remove entity' : 'Add entity'}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6">
          <div
            enable-xr
            data-name="Inspector SpatialDiv"
            className="rounded-xl border border-cyan-700/60 bg-cyan-950/40 p-6"
            style={{
              width: 420,
              minHeight: 190,
              '--xr-depth': 36,
              '--xr-back': 28,
              '--xr-background-material': 'thin',
            }}
          >
            <div className="font-mono text-xs uppercase tracking-widest text-cyan-300">
              SpatialDiv
            </div>
            <h2 className="mt-4 text-xl font-medium">DOM-backed content</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Inspector edits update this placeholder&apos;s CSS so the existing
              layout synchronization remains authoritative.
            </p>
          </div>

          <Model
            enable-xr
            data-name="Inspector Model"
            src="/assets/vehicle-speedster.usdz"
            className="rounded-xl border border-amber-700/60 bg-amber-950/30"
            style={{
              width: 420,
              height: 260,
              '--xr-depth': 120,
              '--xr-back': 64,
            }}
          />
        </section>

        <Reality
          data-name="Inspector Reality"
          className="rounded-xl border border-slate-700 bg-slate-900"
          style={{
            width: 866,
            height: 330,
            '--xr-depth': 180,
            '--xr-back': 90,
          }}
        >
          <UnlitMaterial id="inspector-cyan" color="#58d4df" />
          <SceneGraph>
            {showEntity ? (
              <Entity
                id="inspector-parent"
                name="Inspector parent"
                position={{ x: -0.12, y: 0.04, z: 0 }}
              >
                <BoxEntity
                  id="inspector-box"
                  name="Inspectable box"
                  width={0.18}
                  height={0.12}
                  depth={0.08}
                  materials={['inspector-cyan']}
                  position={{ x: 0.08, y: 0, z: 0.03 }}
                />
              </Entity>
            ) : null}
          </SceneGraph>
        </Reality>
      </div>

      {showInspector ? (
        <WebSpatialInspector
          editable
          width={760}
          height={560}
          attachmentAnchor="trailing"
          contentAlignment="leading"
        />
      ) : null}
    </div>
  )
}
