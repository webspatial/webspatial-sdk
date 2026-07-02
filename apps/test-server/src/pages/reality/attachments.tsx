import { useGSAP } from '@gsap/react'
import {
  AttachmentAsset,
  AttachmentEntity,
  BoxEntity,
  enableDebugTool,
  Entity,
  Model,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import gsap from 'gsap'
import React, { useRef } from 'react'

gsap.registerPlugin(useGSAP)
enableDebugTool()

const REALITY_FRAME = {
  width: '480px',
  height: '420px',
  border: '1px solid #ccc',
} as const

const attachmentDivStyle = { '--xr-back': 66 }

function TestCase({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-gray-300 p-4 rounded mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit: string
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-gray-700">{label}</span>
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
        {unit === ' m' || unit === ' deg' ? value.toFixed(2) : value}
        {unit}
      </span>
    </label>
  )
}

/** 1. Canonical API — Vec3 transforms + meter width/height with live sliders. */
function TestTransformApi() {
  const [posX, setPosX] = React.useState(0)
  const [posY, setPosY] = React.useState(0.14)
  const [posZ, setPosZ] = React.useState(0)
  const [rotY, setRotY] = React.useState(20)
  const [scale, setScale] = React.useState(1)
  const [widthM, setWidthM] = React.useState(0.35)
  const [heightM, setHeightM] = React.useState(0.2)

  const position = { x: posX, y: posY, z: posZ }
  const rotation = { x: 0, y: rotY, z: 0 }
  const scaleVec = { x: scale, y: scale, z: scale }

  return (
    <TestCase title="1. Transform API (position, rotation, scale, width, height)">
      <p className="text-sm text-gray-600 mb-3">
        Drag sliders to update <code className="text-xs">AttachmentEntity</code>{' '}
        transforms and meter dimensions without remounting.
      </p>
      <div className="mb-4 max-w-md space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
        <SliderRow
          label="Position X"
          value={posX}
          min={-0.25}
          max={0.25}
          step={0.01}
          onChange={setPosX}
          unit=" m"
        />
        <SliderRow
          label="Position Y"
          value={posY}
          min={-0.05}
          max={0.35}
          step={0.01}
          onChange={setPosY}
          unit=" m"
        />
        <SliderRow
          label="Position Z"
          value={posZ}
          min={-0.1}
          max={0.25}
          step={0.01}
          onChange={setPosZ}
          unit=" m"
        />
        <SliderRow
          label="Rotation Y"
          value={rotY}
          min={-45}
          max={45}
          step={1}
          onChange={setRotY}
          unit=" deg"
        />
        <SliderRow
          label="Scale"
          value={scale}
          min={0.5}
          max={1.5}
          step={0.05}
          onChange={setScale}
          unit=""
        />
        <SliderRow
          label="Width"
          value={widthM}
          min={0.1}
          max={0.5}
          step={0.01}
          onChange={setWidthM}
          unit=" m"
        />
        <SliderRow
          label="Height"
          value={heightM}
          min={0.08}
          max={0.35}
          step={0.01}
          onChange={setHeightM}
          unit=" m"
        />
      </div>
      <Reality style={{ ...REALITY_FRAME, border: '1px solid #0d9488' }}>
        <UnlitMaterial id="matTransform" color="#0d9488" />
        <AttachmentAsset id="profile-card">
          <div
            style={{
              background: 'rgba(15,23,42,0.92)',
              color: 'white',
              padding: 12,
              borderRadius: 8,
              minHeight: '100%',
              boxSizing: 'border-box',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Profile card</p>
            <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.85 }}>
              {widthM.toFixed(2)}×{heightM.toFixed(2)} m · rotY{' '}
              {rotY.toFixed(0)}°
            </p>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matTransform']}
            />
            <AttachmentEntity
              attachment="profile-card"
              position={position}
              rotation={rotation}
              scale={scaleVec}
              width={widthM}
              height={heightM}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

/** 2. One asset → many placements with shared React state. */
function TestSharedAsset() {
  const [count, setCount] = React.useState(0)

  return (
    <TestCase title="2. Shared asset (1→N portals + React state)">
      <p className="text-sm text-gray-600 mb-2">
        Two <code className="text-xs">AttachmentEntity</code> instances
        reference the same asset. Clicking +1 in either portal updates both and
        the host page mirror.
      </p>
      <Reality style={{ ...REALITY_FRAME, border: '1px solid orange' }}>
        <UnlitMaterial id="matSharedA" color="#ff8800" />
        <UnlitMaterial id="matSharedB" color="#ffaa00" />
        <AttachmentAsset id="shared-counter">
          <div
            style={{
              background: 'rgba(80,40,0,0.85)',
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
              onClick={() => setCount(c => c + 1)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#ff8800',
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
              materials={['matSharedA']}
            />
            <AttachmentEntity
              attachment="shared-counter"
              position={{ x: 0, y: 0.15, z: 0 }}
              width={0.16}
              height={0.08}
            />
          </Entity>
          <Entity position={{ x: 0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matSharedB']}
            />
            <AttachmentEntity
              attachment="shared-counter"
              position={{ x: 0, y: 0.15, z: 0 }}
              rotation={{ x: 0, y: -12, z: 0 }}
              width={0.16}
              height={0.08}
            />
          </Entity>
        </SceneGraph>
      </Reality>
      <p className="text-sm text-gray-500 mt-2">
        Host page count: <strong>{count}</strong>
      </p>
    </TestCase>
  )
}

/** 3. Spatial components inside AttachmentAsset degrade to plain HTML. */
function TestNestingGuards() {
  return (
    <TestCase title="3. Nesting guards (Model / Reality / SpatialDiv)">
      <p className="text-sm text-gray-600 mb-2">
        Spatial components inside{' '}
        <code className="text-xs">AttachmentAsset</code> degrade gracefully.
        Nested <code className="text-xs">Reality</code> renders nothing with a
        console warning.
      </p>
      <Reality style={{ ...REALITY_FRAME, border: '1px solid purple' }}>
        <AttachmentAsset id="nesting-guards">
          <div
            style={{
              background: 'rgba(30,20,60,0.9)',
              color: 'white',
              padding: 12,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13,
            }}
          >
            <section>
              <strong>Model</strong> — degrades to 2D:
              <div
                style={{
                  background: '#fff',
                  padding: 8,
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
            </section>
            <section>
              <strong>Reality</strong> — blocked:
              <div enable-xr style={{ marginTop: 4 }}>
                <Reality
                  style={{ width: 80, height: 80, border: '1px solid white' }}
                >
                  <div>Should not render</div>
                </Reality>
              </div>
            </section>
            <section>
              <strong>SpatialDiv</strong> — plain HTML:
              <div
                enable-xr
                style={{
                  background: '#fff',
                  color: '#000',
                  padding: 8,
                  borderRadius: 6,
                  marginTop: 4,
                  width: 80,
                  height: 40,
                }}
              >
                Spatial content
              </div>
            </section>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <AttachmentEntity
              attachment="nesting-guards"
              position={{ x: 0, y: 0, z: 0 }}
              width={0.3}
              height={0.38}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

/** 4. Runtime attachment prop swap on nested entities (QA reproduction). */
function TestAttachmentSwap() {
  const [parentAttachment, setParentAttachment] = React.useState('hud-a')
  const [childAttachment, setChildAttachment] = React.useState('hud-b')

  return (
    <TestCase title="4. Runtime attachment swap (nested entities)">
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm"
          onClick={() =>
            setParentAttachment(
              parentAttachment === 'hud-a' ? 'hud-b' : 'hud-a',
            )
          }
        >
          Toggle parent ({parentAttachment})
        </button>
        <button
          className="bg-green-500 text-white px-3 py-2 rounded text-sm"
          onClick={() =>
            setChildAttachment(childAttachment === 'hud-a' ? 'hud-b' : 'hud-a')
          }
        >
          Toggle child ({childAttachment})
        </button>
      </div>
      <Reality style={{ ...REALITY_FRAME, border: '1px solid black' }}>
        <UnlitMaterial id="matParent" color="#4444ff" />
        <UnlitMaterial id="matChild" color="#44ff44" />
        <AttachmentAsset id="hud-a">
          <div style={{ background: 'blue', color: 'white', padding: 10 }}>
            Asset A
          </div>
        </AttachmentAsset>
        <AttachmentAsset id="hud-b">
          <div style={{ background: 'green', color: 'white', padding: 10 }}>
            Asset B
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <BoxEntity
              width={0.2}
              height={0.2}
              depth={0.2}
              materials={['matParent']}
            />
            <AttachmentEntity
              attachment={parentAttachment}
              position={{ x: 0, y: 0.2, z: 0 }}
              width={0.15}
              height={0.05}
            />
            <Entity position={{ x: 0.3, y: 0, z: 0 }}>
              <BoxEntity
                width={0.1}
                height={0.1}
                depth={0.1}
                materials={['matChild']}
              />
              <AttachmentEntity
                attachment={childAttachment}
                position={{ x: 0, y: 0.15, z: 0 }}
                width={0.15}
                height={0.05}
              />
            </Entity>
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

/** 5. Duplicate AttachmentAsset id — last definition wins. */
function TestDuplicateAssetId() {
  return (
    <TestCase title="5. Duplicate AttachmentAsset id (last wins)">
      <p className="text-sm text-gray-600 mb-2">
        Both placements should show &quot;SECOND&quot; — only the last{' '}
        <code className="text-xs">AttachmentAsset</code> with a given id
        renders.
      </p>
      <Reality style={{ ...REALITY_FRAME, border: '1px solid #555' }}>
        <UnlitMaterial id="matDupA" color="#5555ff" />
        <UnlitMaterial id="matDupB" color="#55ff55" />
        <AttachmentAsset id="dup-asset">
          <div
            style={{
              background: 'rgba(180,0,0,0.85)',
              color: 'white',
              padding: 10,
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            FIRST
          </div>
        </AttachmentAsset>
        <AttachmentAsset id="dup-asset">
          <div
            style={{
              background: 'rgba(0,150,0,0.85)',
              color: 'white',
              padding: 10,
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            SECOND
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: -0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matDupA']}
            />
            <AttachmentEntity
              attachment="dup-asset"
              position={{ x: 0, y: 0.15, z: 0 }}
              width={0.16}
              height={0.08}
            />
          </Entity>
          <Entity position={{ x: 0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matDupB']}
            />
            <AttachmentEntity
              attachment="dup-asset"
              position={{ x: 0, y: 0.15, z: 0 }}
              width={0.16}
              height={0.08}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function GsapPulseContent() {
  const rootRef = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo(
        '.ws-att-gsap-pulse',
        { scale: 1 },
        {
          scale: 1.14,
          repeat: -1,
          yoyo: true,
          duration: 0.75,
          ease: 'sine.inOut',
        },
      )
    },
    { scope: rootRef },
  )
  return (
    <div
      ref={rootRef}
      style={{
        background: 'rgba(0,60,80,0.9)',
        color: 'white',
        padding: 12,
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <div
        className="ws-att-gsap-pulse"
        style={{ transformOrigin: 'center center', fontWeight: 600 }}
      >
        GSAP pulse
      </div>
    </div>
  )
}

/** 6. GSAP animation inside shared attachment portals. */
function TestGsapInAttachment() {
  return (
    <TestCase title="6. GSAP inside shared attachment">
      <p className="text-sm text-gray-600 mb-2">
        GSAP animates content inside{' '}
        <code className="text-xs">AttachmentAsset</code> portals. Both
        placements share the same asset subtree.
      </p>
      <Reality style={{ ...REALITY_FRAME, border: '1px solid #077' }}>
        <UnlitMaterial id="matGsapA" color="#006666" />
        <UnlitMaterial id="matGsapB" color="#008888" />
        <AttachmentAsset id="gsap-pulse">
          <GsapPulseContent />
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: -0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matGsapA']}
            />
            <AttachmentEntity
              attachment="gsap-pulse"
              position={{ x: 0, y: 0.15, z: 0 }}
              width={0.2}
              height={0.13}
            />
          </Entity>
          <Entity position={{ x: 0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matGsapB']}
            />
            <AttachmentEntity
              attachment="gsap-pulse"
              position={{ x: 0, y: 0.15, z: 0 }}
              width={0.2}
              height={0.13}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

/** 7. Attachment inside SpatialDiv > Reality (host layout edge case). */
function TestSpatialDivHost() {
  return (
    <TestCase title="7. SpatialDiv host wrapper">
      <p className="text-sm text-gray-600 mb-2">
        Attachments work when <code className="text-xs">Reality</code> is nested
        inside a <code className="text-xs">SpatialDiv</code>.
      </p>
      <div
        enable-xr
        style={{
          ...attachmentDivStyle,
          ...REALITY_FRAME,
          border: '1px solid blue',
        }}
      >
        <Reality style={{ width: '100%', height: '100%' }}>
          <UnlitMaterial id="matDivHost" color="#0000ff" />
          <AttachmentAsset id="spatialdiv-host">
            <div
              style={{
                background: 'rgba(0,0,100,0.8)',
                color: 'white',
                padding: 10,
                borderRadius: 8,
              }}
            >
              Inside SpatialDiv
            </div>
          </AttachmentAsset>
          <SceneGraph>
            <Entity position={{ x: 0, y: 0, z: 0.1 }}>
              <BoxEntity
                width={0.1}
                height={0.1}
                depth={0.1}
                materials={['matDivHost']}
              />
              <AttachmentEntity
                attachment="spatialdiv-host"
                position={{ x: 0, y: 0.12, z: 0 }}
                width={0.22}
                height={0.1}
              />
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </TestCase>
  )
}

function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Attachment Tests</h1>
      <div className="flex flex-wrap gap-8">
        <TestTransformApi />
        <TestSharedAsset />
        <TestNestingGuards />
        <TestAttachmentSwap />
        <TestDuplicateAssetId />
        <TestGsapInAttachment />
        <TestSpatialDivHost />
      </div>
    </div>
  )
}

export default App
