import React, { useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { getSession } from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

function App() {
  const [logs, setLogs] = useState('')
  const realityRef = useRef<any>(null)

  function log(...args: any[]) {
    setLogs(pre => {
      const msg = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ')
      return pre + (pre ? '\n' : '') + msg
    })
  }

  const ensureReality = async () => {
    const session = getSession()
    if (!session) {
      log(
        'WebSpatial session unavailable. Please open this demo in Safari on visionOS (Spatial Web) or run with XR_ENV=avp.',
      )
      return null
    }
    const scene = session.getSpatialScene()

    if (!realityRef.current) {
      const reality = await session.createSpatializedDynamic3DElement()
      await reality.updateProperties({ width: 500, height: 500, depth: 100 })
      await scene.addSpatializedElement(reality)
      realityRef.current = reality
    }
    return realityRef.current
  }

  const createPlane = async () => {
    try {
      const session = getSession()
      if (!session) {
        log(
          'WebSpatial session unavailable. Please open this demo in Safari on visionOS (Spatial Web) or run with XR_ENV=avp.',
        )
        return
      }

      const reality = await ensureReality()
      if (!reality) return

      // Create an entity with a Plane geometry + unlit material
      const entity = await session.createEntity()
      const geometry = await session.createPlaneGeometry({
        width: 0.3,
        height: 0.2,
        cornerRadius: 0.02,
      })
      const material = await session.createUnlitMaterial({
        color: '#ff8800',
      })
      const modelComponent = await session.createModelComponent({
        mesh: geometry,
        materials: [material],
      })
      await entity.addComponent(modelComponent)

      // Add to the reality and enable tap logging
      await reality.addEntity(entity)
      await entity.addEvent('spatialtap', (evt: any) => {
        log('plane tapped', { location3D: evt.location3D })
      })

      log('Plane created ✅')
    } catch (error) {
      console.error(error)
      log('Error creating plane ❌', error)
    }
  }

  const createBox = async () => {
    try {
      const session = getSession()
      if (!session) {
        log(
          'WebSpatial session unavailable. Please open this demo in Safari on visionOS (Spatial Web) or run with XR_ENV=avp.',
        )
        return
      }

      const reality = await ensureReality()
      if (!reality) return

      // Create an entity with a Box geometry + unlit material
      const entity = await session.createEntity()
      const geometry = await session.createBoxGeometry({
        width: 0.2,
        height: 0.2,
        depth: 0.1,
        cornerRadius: 0.02,
        splitFaces: false,
      })
      const material = await session.createUnlitMaterial({
        color: '#3366ff',
      })
      const modelComponent = await session.createModelComponent({
        mesh: geometry,
        materials: [material],
      })
      await entity.addComponent(modelComponent)

      // Add to the reality and enable tap logging
      await reality.addEntity(entity)
      await entity.addEvent('spatialtap', (evt: any) => {
        log('box tapped', { location3D: evt.location3D })
      })

      log('Box created ✅')
    } catch (error) {
      console.error(error)
      log('Error creating box ❌', error)
    }
  }

  const supported = !!getSession()

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">Geometry Primitives Test</h1>
      <p className="text-gray-700 mb-4">
        Use these buttons to create primitives in a spatialized reality.
      </p>

      {!supported && (
        <div className="mb-4 text-sm text-red-600">
          WebSpatial not detected. Open in Safari on visionOS or start the dev
          server with XR_ENV=avp.
        </div>
      )}

      <div className="flex gap-3">
        <button className={btnCls} onClick={createPlane} disabled={!supported}>
          Create Plane
        </button>
        <button className={btnCls} onClick={createBox} disabled={!supported}>
          Create Box
        </button>
      </div>

      <div className="mt-6">
        <div className="text-gray-700">Console</div>
        <pre style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>{logs}</pre>
      </div>
    </div>
  )
}

// Initialize react
const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
document.documentElement.style.backgroundColor = 'transparent'
