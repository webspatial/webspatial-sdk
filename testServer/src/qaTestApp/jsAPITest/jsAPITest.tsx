// @ts-nocheck
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial, SpatialHelper } from '@webspatial/core-sdk'

const spatial = new Spatial()
let session = spatial.requestSession()
if (session) {
  session.getCurrentWindowComponent().setStyle({
    material: { type: 'translucent' },
  })
}

function App() {
  const [testResult, setTestResult] = useState('Result')
  const [toggle, setToggle] = useState(false)

  const getVersionInfo = () => {
    const clientVersion =
      'clientVersion: ' +
      spatial.getClientVersion() +
      '\n' +
      'NativeVersion: ' +
      spatial.getNativeVersion() +
      '\n' +
      'isSupported: ' +
      spatial.isSupported()
    setTestResult(clientVersion)
  }

  const createSession = () => {
    if (spatial.isSupported()) {
      session = spatial.requestSession()
      if (session) {
        setTestResult('Session Created')
      }
    }
  }

  const createEntity = async () => {
    // Create an entity
    session = spatial.requestSession()
    var entity = await session.createEntity()
    if (entity) {
      setTestResult('entity created' + entity)
    } else {
      setTestResult('entity not created')
    }
    entity.transform.position.x = 500
    entity.transform.position.y = 100
    entity.transform.position.z = 100
    await entity.updateTransform()

    // Set coordinate space to dom so x/y/z is in pixel space relative to its parent
    await entity.setCoordinateSpace('Dom')

    // Create a window context we can display html within
    let pageWindow = await session.createWindowContext()
    pageWindow!.document.documentElement.style.backgroundColor =
      'rgba(0,170,139,0.6)'
    var newDiv = document.createElement('div')
    newDiv.innerHTML = "<div style='color:red;'>Hello world</div>"
    pageWindow!.document.body.appendChild(newDiv)

    // Add window content to entity
    let wc = await session.createWindowComponent()
    await wc.setResolution(200, 100)
    await wc.setFromWindow(pageWindow!.window)
    await entity.setComponent(wc)

    // Add entity to the current page
    var rootWC = await session.getCurrentWindowComponent()
    var rootEntity = await rootWC.getEntity()
    await entity.setParent(rootEntity!)
    await session.getCurrentWindowComponent().setStyle({
      material: { type: 'translucent' },
    })
  }

  const setMaterial = async () => {
    if (session) {
      setTestResult('session exists')
    } else {
      setTestResult('session not exists')
    }
    setToggle(!toggle)
    console.log(toggle)
    await session.getCurrentWindowComponent().setStyle({
      material: { type: toggle ? 'translucent' : 'none' },
    })
    setTestResult('Set Material')
  }

  const spatialHelper = () => {
    SpatialHelper.instance.navigation.openPanel(
      'https://www.npmjs.com/package/@webspatial/core-sdk',
      {
        resolution: {
          width: 1000,
          height: 1000,
        },
      },
    )
    setTestResult('Open Panel')
  }

  const volumetric = async () => {
    let sh = SpatialHelper.instance!
    if (sh) {
      // Create new window container
      var container = await sh.session.createWindowContainer({
        style: 'Volumetric',
      })
      // setup volume for the entity
      var rootEntity = await sh.session.createEntity()
      await rootEntity.setCoordinateSpace('Root')
      rootEntity.setComponent(await sh.session.createViewComponent())

      //Create a mesh, and add it into the root volume
      var box = await sh.shape.createShapeEntity('box')
      await box.setParent(rootEntity)

      // add the volume to window
      await container.setRootEntity(rootEntity)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-44">
      <h1 style={{ textAlign: 'center', fontSize: '36px' }}>
        <div
          enable-xr
          style={{
            position: { z: 50 }, // Bulge 50 in the z direction
          }}
          className="text-6xl font-bold text-white p-8 rounded-xl"
        >
          JS API Tests
        </div>
      </h1>
      {/* Navigation Bar */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a href="/" className="hover:text-blue-400 transition-colors">
          Return to home page
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          Go back
        </a>
      </div>

      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] flex items-center justify-center">
          <div
            id="father"
            className="flex"
            style={{
              backgroundColor: 'rgba(173, 216, 230, 0.2)',
              padding: '30px',
            }}
          >
            <div
              enable-xr
              className="test-element w-32 h-32  bg-gradient-to-r bg-opacity-15 bg-red-200/30 rounded-lg flex items-center justify-center text-white  duration-300"
              style={{ position: 'relative' }}
            >
              {testResult}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <button className="btn btn-primary" onClick={getVersionInfo}>
            get client version
          </button>
          <button className="btn btn-primary" onClick={createSession}>
            create session
          </button>
          <button className="btn btn-primary" onClick={createEntity}>
            create hello world window
          </button>
          <button className="btn btn-primary" onClick={setMaterial}>
            toggle material
          </button>
          <button className="btn btn-primary" onClick={spatialHelper}>
            helper sss
          </button>
          <button className="btn btn-primary" onClick={volumetric}>
            Volumetric
          </button>
        </div>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
