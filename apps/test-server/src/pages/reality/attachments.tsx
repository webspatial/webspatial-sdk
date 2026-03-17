import React from 'react'
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
      </div>
    </div>
  )
}

export default App
