import {
  AttachmentAsset,
  AttachmentEntity,
  BoxEntity,
  enableDebugTool,
  Entity,
  Model,
  PlaneEntity,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import React from 'react'

enableDebugTool()

const realityStyle = {
  width: '100%',
  maxWidth: 480,
  height: 420,
  border: '1px solid #374151',
  borderRadius: 8,
} as const

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-gray-300 rounded-lg p-5 mb-8 max-w-3xl">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description ? (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      ) : null}
      {children}
    </section>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-gray-700">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 min-w-0"
      />
      <span className="w-20 shrink-0 tabular-nums text-gray-600 text-right">
        {format(value)}
      </span>
    </label>
  )
}

/** Core smoke: asset id + entity placement + HTML portal. */
function BasicUsage() {
  return (
    <Section
      title="Basic usage"
      description="AttachmentAsset declares content by id; AttachmentEntity references that id and anchors to a parent entity (like ModelAsset / ModelEntity)."
    >
      <Reality style={realityStyle}>
        <UnlitMaterial id="att-demo-mat" color="#6366f1" />
        <AttachmentAsset id="hud-panel">
          <div
            style={{
              background: 'rgba(30,30,60,0.92)',
              color: 'white',
              padding: 12,
              borderRadius: 8,
              minHeight: '100%',
              boxSizing: 'border-box',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>HUD panel</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.85 }}>
              Attachment appeared!
            </p>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['att-demo-mat']}
            />
            <AttachmentEntity
              attachment="hud-panel"
              position={{ x: 0, y: 0.12, z: 0 }}
              width={0.22}
              height={0.12}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </Section>
  )
}

/** One asset id, multiple entities — shared React state across portals. */
function SharedAsset() {
  const [count, setCount] = React.useState(0)
  const [showRight, setShowRight] = React.useState(true)

  return (
    <Section
      title="One asset, many placements"
      description="A single AttachmentAsset id can feed multiple AttachmentEntity instances. React state is shared; optional placement ids keep portals stable when one entity unmounts."
    >
      <button
        type="button"
        className="mb-3 rounded bg-cyan-700 px-3 py-1.5 text-sm text-white"
        onClick={() => setShowRight(v => !v)}
      >
        Toggle right placement ({showRight ? 'on' : 'off'})
      </button>
      <Reality style={realityStyle}>
        <UnlitMaterial id="att-shared-a" color="#f97316" />
        <UnlitMaterial id="att-shared-b" color="#fb923c" />
        <AttachmentAsset id="shared-counter">
          <div
            style={{
              background: 'rgba(80,40,0,0.88)',
              color: 'white',
              padding: 10,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <p style={{ margin: 0, fontSize: 14 }}>Count: {count}</p>
            <button
              type="button"
              onClick={() => setCount(c => c + 1)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#f97316',
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              +1
            </button>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: -0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['att-shared-a']}
            />
            <AttachmentEntity
              id="counter-left"
              attachment="shared-counter"
              position={{ x: 0, y: 0.14, z: 0 }}
              width={0.16}
              height={0.09}
            />
          </Entity>
          <Entity position={{ x: 0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['att-shared-b']}
            />
            {showRight ? (
              <AttachmentEntity
                id="counter-right"
                attachment="shared-counter"
                position={{ x: 0, y: 0.14, z: 0 }}
                width={0.16}
                height={0.09}
              />
            ) : null}
          </Entity>
        </SceneGraph>
      </Reality>
      <p className="mt-2 text-sm text-gray-500">
        Host page mirror: <strong>{count}</strong>
      </p>
    </Section>
  )
}

/** Interactive transform + sizing in one scene. */
function LiveTransformAndSizing() {
  const [posY, setPosY] = React.useState(0.12)
  const [rotZ, setRotZ] = React.useState(0)
  const [scale, setScale] = React.useState(1)
  const [widthM, setWidthM] = React.useState(0.24)
  const [heightM, setHeightM] = React.useState(0.14)

  const rotation = { x: 0, y: 0, z: rotZ }
  const scaleVec = { x: scale, y: scale, z: scale }

  return (
    <Section
      title="Live transform & sizing"
      description="Drag sliders to update position, rotation, scale, and meter width/height without remounting. Attachment dimensions align with the sibling PlaneEntity."
    >
      <div className="mb-4 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
        <SliderRow
          label="Position Y"
          value={posY}
          min={-0.05}
          max={0.3}
          step={0.01}
          onChange={setPosY}
          format={v => `${v.toFixed(2)} m`}
        />
        <SliderRow
          label="Rotation Z"
          value={rotZ}
          min={-180}
          max={180}
          step={5}
          onChange={setRotZ}
          format={v => `${v}°`}
        />
        <SliderRow
          label="Scale"
          value={scale}
          min={0.25}
          max={2}
          step={0.05}
          onChange={setScale}
          format={v => `${v.toFixed(2)}×`}
        />
        <SliderRow
          label="Width"
          value={widthM}
          min={0.1}
          max={0.4}
          step={0.01}
          onChange={setWidthM}
          format={v => `${v.toFixed(2)} m`}
        />
        <SliderRow
          label="Height"
          value={heightM}
          min={0.06}
          max={0.28}
          step={0.01}
          onChange={setHeightM}
          format={v => `${v.toFixed(2)} m`}
        />
      </div>
      <Reality style={realityStyle}>
        <UnlitMaterial id="att-live-mat" color="#d946ef" />
        <AttachmentAsset id="live-panel">
          <div
            style={{
              background: 'rgba(60,20,70,0.92)',
              color: 'white',
              padding: 12,
              borderRadius: 8,
              minHeight: '100%',
              boxSizing: 'border-box',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Live panel</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.85 }}>
              rot Z {rotZ}° · scale {scale.toFixed(2)}×
            </p>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.05 }}>
            <Entity rotation={rotation} position={{ x: 0, y: 0, z: -0.01 }}>
              <PlaneEntity
                width={widthM}
                height={heightM}
                materials={['att-live-mat']}
              />
            </Entity>
            <AttachmentEntity
              attachment="live-panel"
              position={{ x: 0, y: posY, z: 0 }}
              rotation={rotation}
              scale={scaleVec}
              width={widthM}
              height={heightM}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </Section>
  )
}

/** Spatial components inside attachment content degrade safely. */
function NestingGuards() {
  return (
    <Section
      title="Nesting guards"
      description="Inside AttachmentAsset content: Model and SpatialDiv degrade to plain HTML; nested Reality returns null with a console warning."
    >
      <Reality style={realityStyle}>
        <AttachmentAsset id="nesting-demo">
          <div
            style={{
              background: 'rgba(20,20,30,0.92)',
              color: 'white',
              padding: 12,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 12,
            }}
          >
            <div>
              <strong>Model</strong> (2D fallback)
              <div
                style={{
                  background: '#fff',
                  padding: 6,
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                <Model
                  enable-xr
                  src="/modelasset/cone.usdz"
                  style={{ width: 80, height: 80, display: 'block' }}
                />
              </div>
            </div>
            <div>
              <strong>SpatialDiv</strong> (plain HTML)
              <div
                enable-xr
                style={{
                  background: '#e5e7eb',
                  color: '#111',
                  padding: 8,
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                Degraded spatial div
              </div>
            </div>
            <div>
              <strong>Reality</strong> (blocked)
              <div enable-xr style={{ marginTop: 4 }}>
                <Reality
                  style={{
                    width: 80,
                    height: 48,
                    border: '1px solid #666',
                  }}
                >
                  <span>Should not appear</span>
                </Reality>
              </div>
            </div>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.05 }}>
            <AttachmentEntity
              attachment="nesting-demo"
              position={{ x: 0, y: 0, z: 0 }}
              width={0.28}
              height={0.32}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </Section>
  )
}

/** Runtime swap of which asset id an entity references. */
function RuntimeAssetSwap() {
  const [assetId, setAssetId] = React.useState<'badge-a' | 'badge-b'>('badge-a')

  return (
    <Section
      title="Runtime asset swap"
      description="Change which AttachmentAsset id an entity references; the portal should follow without remounting the native attachment."
    >
      <button
        type="button"
        className="mb-3 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white"
        onClick={() =>
          setAssetId(id => (id === 'badge-a' ? 'badge-b' : 'badge-a'))
        }
      >
        Switch asset (current: {assetId})
      </button>
      <Reality style={realityStyle}>
        <UnlitMaterial id="att-swap-mat" color="#4f46e5" />
        <AttachmentAsset id="badge-a">
          <div
            style={{
              background: '#312e81',
              color: 'white',
              padding: 10,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Asset A
          </div>
        </AttachmentAsset>
        <AttachmentAsset id="badge-b">
          <div
            style={{
              background: '#065f46',
              color: 'white',
              padding: 10,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Asset B
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['att-swap-mat']}
            />
            <AttachmentEntity
              id="swap-placement"
              attachment={assetId}
              position={{ x: 0, y: 0.14, z: 0 }}
              width={0.18}
              height={0.08}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </Section>
  )
}

export default function AttachmentTests() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Attachments</h1>
      <p className="text-sm text-gray-600 mb-8">
        Feature demos for <code className="text-xs">AttachmentAsset</code>{' '}
        (content by id) and <code className="text-xs">AttachmentEntity</code>{' '}
        (3D placement). Open the browser console for nesting-guard warnings.
      </p>
      <BasicUsage />
      <SharedAsset />
      <LiveTransformAndSizing />
      <NestingGuards />
      <RuntimeAssetSwap />
    </div>
  )
}
