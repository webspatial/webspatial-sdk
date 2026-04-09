import React, { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  AttachmentAsset,
  AttachmentEntity,
  BoxEntity,
  enableDebugTool,
  Entity,
  Reality,
  SceneGraph,
  UnlitMaterial,
  Model,
} from '@webspatial/react-sdk'

gsap.registerPlugin(useGSAP)
enableDebugTool()

const attachmentDivStyle = {
  '--xr-back': 66,
}

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

function TestBasicAttachment() {
  return (
    <TestCase title="1. Basic Attachment">
      <Reality
        style={{ width: '400px', height: '400px', border: '1px solid black' }}
      >
        <UnlitMaterial id="matBasic" color="#ff0000" />
        <AttachmentAsset name="basic-attachment">
          <div
            style={{
              background: 'black',
              color: 'white',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <p>Basic Attachment Content</p>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matBasic']}
            />
            <AttachmentEntity
              attachment="basic-attachment"
              position={[0, 0.1, 0]}
              size={{ width: 200, height: 100 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function TestNestedRealityInSpatialDiv() {
  return (
    <TestCase title="2. Attachment inside SpatialDiv > Reality">
      <p className="text-sm text-gray-600 mb-2">
        Testing that AttachmentEntity works normally when Reality is nested
        inside a SpatialDiv.
      </p>
      <div
        enable-xr
        style={{
          ...attachmentDivStyle,
          width: '400px',
          height: '400px',
          border: '1px solid blue',
        }}
      >
        <Reality style={{ width: '100%', height: '100%' }}>
          <UnlitMaterial id="matDiv" color="#0000ff" />
          <AttachmentAsset name="nested-spatialdiv-attachment">
            <div
              style={{
                background: 'rgba(0,0,100,0.8)',
                color: 'white',
                padding: 10,
                borderRadius: 8,
              }}
            >
              <p>Attachment inside SpatialDiv</p>
            </div>
          </AttachmentAsset>
          <SceneGraph>
            <Entity position={{ x: 0, y: 0, z: 0.1 }}>
              <BoxEntity
                width={0.1}
                height={0.1}
                depth={0.1}
                materials={['matDiv']}
              />
              <AttachmentEntity
                attachment="nested-spatialdiv-attachment"
                position={[0, 0.1, 0]}
                size={{ width: 220, height: 100 }}
              />
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </TestCase>
  )
}

function TestModelFallback() {
  return (
    <TestCase title="3. Model Fallback inside Attachment">
      <p className="text-sm text-gray-600 mb-2">
        Models nested inside an AttachmentAsset should degrade to 2D models
        gracefully.
      </p>
      <Reality
        style={{ width: '400px', height: '400px', border: '1px solid green' }}
      >
        {/* <p> Testing html</p>
        <Model
          // enable-xr
          src="/modelasset/cone.usdz"
          style={{ width: 100, height: 100, background: '#fff' }}
        /> */}
        <AttachmentAsset name="model-fallback-attachment">
          <div
            style={{
              background: 'rgba(0,100,0,0.8)',
              color: 'white',
              padding: 10,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p className="mb-2">Model Fallback below:</p>
            <div style={{ background: '#fff', padding: 10, borderRadius: 8 }}>
              <Model
                enable-xr
                src="/modelasset/cone.usdz"
                style={{ width: 150, height: 150, display: 'block' }}
              />
            </div>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <AttachmentEntity
              attachment="model-fallback-attachment"
              position={[0, 0, 0]}
              size={{ width: 300, height: 250 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function TestRealityFallback() {
  return (
    <TestCase title="4. Reality Fallback inside Attachment">
      <p className="text-sm text-gray-600 mb-2">
        Reality nested inside an AttachmentAsset should warn and render nothing.
      </p>
      <Reality
        style={{ width: '400px', height: '400px', border: '1px solid red' }}
      >
        <AttachmentAsset name="reality-fallback-attachment">
          <div
            style={{
              background: 'rgba(100,0,0,0.8)',
              color: 'white',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <p className="mb-2">Nested Reality below:</p>
            <div enable-xr>
              <Reality
                style={{
                  width: '100px',
                  height: '100px',
                  border: '1px solid white',
                }}
              >
                <div style={{ color: 'white' }}>Should not render in 3D</div>
              </Reality>
            </div>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <AttachmentEntity
              attachment="reality-fallback-attachment"
              position={[0, 0, 0]}
              size={{ width: 250, height: 200 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function TestSpatialDivFallback() {
  return (
    <TestCase title="5. SpatialDiv Fallback inside Attachment">
      <p className="text-sm text-gray-600 mb-2">
        SpatialDiv nested inside an AttachmentAsset should degrade safely into
        the attachment.
      </p>
      <Reality
        style={{ width: '400px', height: '400px', border: '1px solid purple' }}
      >
        <AttachmentAsset name="spatialdiv-fallback-attachment">
          <div
            style={{
              background: 'rgba(50,0,100,0.8)',
              color: 'white',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <p className="mb-2">SpatialDiv Fallback below:</p>
            <div
              enable-xr
              style={{
                background: '#fff',
                color: '#000',
                padding: 10,
                borderRadius: 8,
                width: 100,
                height: 100,
              }}
            >
              <span>Spatial Content</span>
            </div>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <AttachmentEntity
              attachment="spatialdiv-fallback-attachment"
              position={[0, 0, 0]}
              size={{ width: 250, height: 200 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function TestSharedAttachmentState() {
  const [count, setCount] = React.useState(0)

  return (
    <TestCase title="6. Shared State — Multiple AttachmentEntities referencing same AttachmentAsset">
      <p className="text-sm text-gray-600 mb-2">
        Two AttachmentEntities reference the same "shared-counter" asset.
        Clicking +1 in either portal should update the count in both, proving
        React state is shared across instances.
      </p>
      <Reality
        style={{ width: '500px', height: '400px', border: '1px solid orange' }}
      >
        <UnlitMaterial id="matSharedA" color="#ff8800" />
        <UnlitMaterial id="matSharedB" color="#ffaa00" />

        <AttachmentAsset name="shared-counter">
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
          {/* First entity — left box */}
          <Entity position={{ x: -0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matSharedA']}
            />
            <AttachmentEntity
              attachment="shared-counter"
              position={[0, 0.15, 0]}
              size={{ width: 160, height: 80 }}
            />
          </Entity>

          {/* Second entity — right box, same attachment name */}
          <Entity position={{ x: 0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matSharedB']}
            />
            <AttachmentEntity
              attachment="shared-counter"
              position={[0, 0.15, 0]}
              size={{ width: 160, height: 80 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>

      {/* Host-page mirror — proves the same React state drives both portals and the 2D page */}
      <p className="text-sm text-gray-500 mt-2">
        Host page count mirror: <strong>{count}</strong> — should always match
        both portals.
      </p>
    </TestCase>
  )
}

function TestAttachmentAnimation() {
  const [y, setY] = React.useState(0)

  React.useEffect(() => {
    let raf: number
    const animate = () => {
      setY(Math.sin(Date.now() / 800) * 0.08)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <TestCase title="7. Attachment Follows Animated Entity">
      <p className="text-sm text-gray-600 mb-2">
        Attachment should follow its parent entity as it animates up and down.
      </p>
      <Reality
        style={{ width: '400px', height: '400px', border: '1px solid teal' }}
      >
        <UnlitMaterial id="matAnim" color="#00aaaa" />
        <AttachmentAsset name="anim-attachment">
          <div
            style={{
              background: 'rgba(0,80,80,0.85)',
              color: 'white',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 14 }}>Following parent</p>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matAnim']}
            />
            <AttachmentEntity
              attachment="anim-attachment"
              position={[0, 0.12, 0]}
              size={{ width: 180, height: 60 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function TestNestedAttachmentSwap() {
  const [parentAttachment, setParentAttachment] = React.useState('hud')
  const [childAttachment, setChildAttachment] = React.useState('hudChild')

  return (
    <TestCase title="8. Nested Attachment Swap (QA Reproduction)">
      <div className="mb-4 flex gap-4">
        <button
          className="bg-blue-500 text-white p-2 rounded"
          onClick={() =>
            setParentAttachment(parentAttachment === 'hud' ? 'hudChild' : 'hud')
          }
        >
          Toggle Parent (Current: {parentAttachment})
        </button>
        <button
          className="bg-green-500 text-white p-2 rounded"
          onClick={() =>
            setChildAttachment(childAttachment === 'hud' ? 'hudChild' : 'hud')
          }
        >
          Toggle Child (Current: {childAttachment})
        </button>
      </div>

      <Reality
        style={{ width: '500px', height: '500px', border: '1px solid black' }}
      >
        <UnlitMaterial id="matParent" color="#4444ff" />
        <UnlitMaterial id="matChild" color="#44ff44" />

        {/* Asset 1: HUD */}
        <AttachmentAsset name="hud">
          <div style={{ background: 'blue', color: 'white', padding: 10 }}>
            <strong>HUD ASSET</strong>
          </div>
        </AttachmentAsset>

        {/* Asset 2: HUD Child */}
        <AttachmentAsset name="hudChild">
          <div style={{ background: 'green', color: 'white', padding: 10 }}>
            <strong>HUD CHILD ASSET</strong>
          </div>
        </AttachmentAsset>

        <SceneGraph>
          {/* Parent Box */}
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <BoxEntity
              width={0.2}
              height={0.2}
              depth={0.2}
              materials={['matParent']}
            />
            <AttachmentEntity
              attachment={parentAttachment}
              position={[0, 0.2, 0]}
              size={{ width: 150, height: 50 }}
            />

            {/* Nested Child Box */}
            <Entity position={{ x: 0.3, y: 0, z: 0 }}>
              <BoxEntity
                width={0.1}
                height={0.1}
                depth={0.1}
                materials={['matChild']}
              />
              <AttachmentEntity
                attachment={childAttachment}
                position={[0, 0.15, 0]}
                size={{ width: 150, height: 50 }}
              />
            </Entity>
          </Entity>
        </SceneGraph>
      </Reality>

      <p className="mt-2 text-sm text-gray-600">
        <strong>Validation:</strong> Change Parent to "hudChild". Then change
        Child to "hud". If the Parent jumps back to "hud" automatically, the bug
        is confirmed.
      </p>
    </TestCase>
  )
}

/** GSAP-driven scale pulse; used inside AttachmentAsset portals. */
function GsapPulseAttachmentContent() {
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
      <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9 }}>
        Scale should loop on this panel.
      </p>
    </div>
  )
}

function TestGSAPSingleAttachment() {
  return (
    <TestCase title="10. GSAP inside a single AttachmentEntity">
      <p className="text-sm text-gray-600 mb-2">
        Baseline: one AttachmentEntity and one AttachmentAsset. GSAP should
        animate the attachment content (continuous scale pulse).
      </p>
      <Reality
        style={{ width: '400px', height: '400px', border: '1px solid #0a7' }}
      >
        <UnlitMaterial id="matGsapSingle" color="#008877" />
        <AttachmentAsset name="gsap-single-pulse">
          <GsapPulseAttachmentContent />
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matGsapSingle']}
            />
            <AttachmentEntity
              attachment="gsap-single-pulse"
              position={[0, 0.12, 0]}
              size={{ width: 220, height: 120 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function TestGSAPSharedAttachmentAsset() {
  return (
    <TestCase title="11. Shared AttachmentAsset + GSAP">
      <p className="text-sm text-gray-600 mb-2">
        Two AttachmentEntities use the same AttachmentAsset. React portals the
        same subtree into each container; Expect both to show the same text, but
        the scale pulse may appear on only one side.
      </p>
      <Reality
        style={{ width: '500px', height: '400px', border: '1px solid #077' }}
      >
        <UnlitMaterial id="matGsapSharedA" color="#006666" />
        <UnlitMaterial id="matGsapSharedB" color="#008888" />
        <AttachmentAsset name="gsap-shared-pulse">
          <GsapPulseAttachmentContent />
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: -0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matGsapSharedA']}
            />
            <AttachmentEntity
              attachment="gsap-shared-pulse"
              position={[0, 0.15, 0]}
              size={{ width: 200, height: 130 }}
            />
          </Entity>
          <Entity position={{ x: 0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matGsapSharedB']}
            />
            <AttachmentEntity
              attachment="gsap-shared-pulse"
              position={[0, 0.15, 0]}
              size={{ width: 200, height: 130 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
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
        {unit === ' m' ? value.toFixed(2) : value}
        {unit}
      </span>
    </label>
  )
}

function TestAttachmentPositionSizeSliders() {
  const [posX, setPosX] = React.useState(0)
  const [posY, setPosY] = React.useState(0.12)
  const [posZ, setPosZ] = React.useState(0)
  const [sizeW, setSizeW] = React.useState(220)
  const [sizeH, setSizeH] = React.useState(120)

  const position: [number, number, number] = [posX, posY, posZ]
  const size = { width: sizeW, height: sizeH }

  return (
    <TestCase title="12. Dynamic position & size (sliders)">
      <p className="text-sm text-gray-600 mb-3">
        Drag sliders to update <code className="text-xs">AttachmentEntity</code>{' '}
        position (meters, relative to parent) and size (pixels). The native
        attachment should follow without remounting.
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
          label="Width"
          value={sizeW}
          min={100}
          max={400}
          step={10}
          onChange={setSizeW}
          unit=" px"
        />
        <SliderRow
          label="Height"
          value={sizeH}
          min={60}
          max={280}
          step={10}
          onChange={setSizeH}
          unit=" px"
        />
      </div>
      <Reality
        style={{ width: '480px', height: '420px', border: '1px solid #6366f1' }}
      >
        <UnlitMaterial id="matSliderAtt" color="#6366f1" />
        <AttachmentAsset name="slider-dynamic-attachment">
          <div
            style={{
              background: 'rgba(40,40,90,0.92)',
              color: 'white',
              padding: 12,
              borderRadius: 8,
              minHeight: '100%',
              boxSizing: 'border-box',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Resizable panel</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.85 }}>
              {sizeW}×{sizeH}px · offset ({posX.toFixed(2)}, {posY.toFixed(2)},{' '}
              {posZ.toFixed(2)}) m
            </p>
          </div>
        </AttachmentAsset>
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matSliderAtt']}
            />
            <AttachmentEntity
              attachment="slider-dynamic-attachment"
              position={position}
              size={size}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function TestLastDefinitionWins() {
  return (
    <TestCase title="9. Last Definition Wins — Duplicate AttachmentAsset name">
      <p className="text-sm text-gray-600 mb-2">
        Only the second asset with the same name should render.
      </p>
      <Reality
        style={{ width: '500px', height: '400px', border: '1px solid #555' }}
      >
        <UnlitMaterial id="matLWLeft" color="#5555ff" />
        <UnlitMaterial id="matLWRight" color="#55ff55" />

        <AttachmentAsset name="dup-asset">
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
        <AttachmentAsset name="dup-asset">
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
              materials={['matLWLeft']}
            />
            <AttachmentEntity
              attachment="dup-asset"
              position={[0, 0.15, 0]}
              size={{ width: 160, height: 80 }}
            />
          </Entity>
          <Entity position={{ x: 0.15, y: 0, z: 0.1 }}>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matLWRight']}
            />
            <AttachmentEntity
              attachment="dup-asset"
              position={[0, 0.15, 0]}
              size={{ width: 160, height: 80 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </TestCase>
  )
}

function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Attachment Tests</h1>

      <div className="flex flex-wrap gap-8">
        <TestBasicAttachment />
        <TestNestedRealityInSpatialDiv />
        <TestModelFallback />
        <TestRealityFallback />
        <TestSpatialDivFallback />
        <TestSharedAttachmentState />
        <TestAttachmentAnimation />
        <TestNestedAttachmentSwap />
        <TestLastDefinitionWins />
        <TestGSAPSingleAttachment />
        <TestGSAPSharedAttachmentAsset />
        <TestAttachmentPositionSizeSliders />
      </div>
    </div>
  )
}

export default App
