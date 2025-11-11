import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { getSession } from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

function App() {
  const [logs, setLogs] = useState('')

  function log(...args: any[]) {
    setLogs(pre => {
      const msg = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ')
      return pre + (pre ? '\n' : '') + msg
    })
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
      const scene = session.getSpatialScene()

      // Create a spatialized 3D container (“reality”) and add it to the scene
      const reality = await session.createSpatializedDynamic3DElement()
      await reality.updateProperties({ width: 500, height: 500, depth: 100 })
      await scene.addSpatializedElement(reality)

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

  const supported = !!getSession()

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">Plane Geometry Test</h1>
      <p className="text-gray-700 mb-4">
        Click the button to create a plane in a spatialized reality.
      </p>

      {!supported && (
        <div className="mb-4 text-sm text-red-600">
          WebSpatial not detected. Open in Safari on visionOS or start the dev
          server with XR_ENV=avp.
        </div>
      )}

      <button className={btnCls} onClick={createPlane} disabled={!supported}>
        Create Plane
      </button>

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
