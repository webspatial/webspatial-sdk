import ReactDOM from 'react-dom/client'
import React, { useState } from 'react'
import { SpatialEntity, SpatialHelper } from '@xrsdk/runtime'
import { Model, SpatialDiv, getSession } from '@xrsdk/react'

import { Provider } from 'react-redux'
import { initMessageListener } from 'redux-state-sync'
import { useDispatch, useSelector } from 'react-redux'
import store, { increment } from './store.ts'
import { Vec3 } from '@xrsdk/runtime'
initMessageListener(store)

function App() {
  const [count, setCount] = useState(0)
  const sharedCount = useSelector((state: any) => state.count.value)
  const dispatch = useDispatch()
  const [created, setCreated] = useState(false)

  var volumeModelEnt: SpatialEntity | null = null
  var volumePanelEnt: SpatialEntity | null = null

  const children = []
  for (var i = sharedCount - 1; i >= 0; i -= 1) {
    children.push(
      <SpatialDiv
        key={i}
        className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-4"
        spatialStyle={{ position: { z: 100 } }}
      ></SpatialDiv>,
    )
  }
  var goHome = () => {
    history.go(-1)
  }
  return (
    <>
      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
          <a href="#" onClick={goHome}>
            Go Back
          </a>
        </div>
      </div>

      <div className="flex text-white">
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Toggle Immersive</h1>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              className="sr-only peer"
              onChange={async e => {
                var session = await getSession()
                if (e.target.checked) {
                  session!.openImmersiveSpace()
                  if (!created) {
                    setCreated(true)
                    var immersiveWG = await session!.getImmersiveWindowGroup()
                    var ent = await session!.createEntity()
                    ent.transform.position.x = 0
                    ent.transform.position.y = 1.3
                    ent.transform.position.z = -1
                    ent.transform.scale = new Vec3(0.3, 0.3, 0.3)
                    await ent.updateTransform()
                    await immersiveWG.setRootEntity(ent)
                    var helmetModel = await session!.createModelComponent({
                      url: '/src/assets/FlightHelmet.usdz',
                    })
                    await ent.setComponent(helmetModel)
                  }
                } else {
                  session!.dismissImmersiveSpace()
                }
              }}
            ></input>
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Open Volumetric</h1>
          <button
            className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async e => {
              var session = await getSession()
              var wg = await session!.createWindowGroup({ style: 'Volumetric' })

              var spatialViewEnt = await session!.createEntity()
              await spatialViewEnt.setCoordinateSpace('Root')
              var vc = await session!.createViewComponent()
              await spatialViewEnt.setComponent(vc)

              var ent = await session!.createEntity()
              ent.transform.position.x = 0
              ent.transform.position.y = 0
              ent.transform.position.z = 0
              ent.transform.scale = new Vec3(3.0, 3.0, 3.0)
              await ent.updateTransform()
              await ent.setParent(spatialViewEnt)
              volumePanelEnt = ent

              var i = await session!.createWindowComponent()
              await i.setResolution(300, 300)
              await i.loadURL('/src/embed/basic.html')
              await ent.setComponent(i)

              var ent = await session!.createEntity()
              ent.transform.position.x = 0
              ent.transform.position.y = -0.4
              ent.transform.position.z = 0
              ent.transform.scale = new Vec3(0.8, 0.8, 0.8)
              await ent.updateTransform()
              await ent.setParent(spatialViewEnt)
              var helmetModel = await session!.createModelComponent({
                url: '/src/assets/FlightHelmet.usdz',
              })
              await ent.setComponent(helmetModel)

              await wg.setRootEntity(spatialViewEnt)
              volumeModelEnt = ent
            }}
          >
            Click Me
          </button>
          <input
            type="range"
            step="0.005"
            className="mt-10 w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
            // style={{ height: "30px" }}
            onChange={async e => {
              if (volumeModelEnt && volumePanelEnt) {
                volumeModelEnt.transform.position = new Vec3(
                  Number(e.target.value) / 1000,
                  -0.4,
                  0,
                )
                volumePanelEnt.transform.position = new Vec3(
                  -(Number(e.target.value) / 1000),
                  0,
                  0,
                )
                await volumeModelEnt.updateTransform()
                await volumePanelEnt.updateTransform()
              }
            }}
          ></input>
        </div>
        <div className="select-none p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Open Plain</h1>
          <button
            className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async e => {
              var session = await getSession()
              var wg = await session!.createWindowGroup({ style: 'Plain' })

              var ent = await session!.createEntity()
              ent.transform.position.x = 0
              ent.transform.position.y = 0
              ent.transform.position.z = 0
              await ent.updateTransform()

              volumePanelEnt = ent

              var i = await session!.createWindowComponent({ windowGroup: wg })
              await i.setResolution(300, 300)
              await i.loadURL('/src/jsApiTestPages/testList.html')
              await ent.setCoordinateSpace('Root')
              await ent.setComponent(i)

              await wg.setRootEntity(ent)
            }}
          >
            Click Me
          </button>
          <h1>test: {sharedCount}</h1>
          <button
            className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async e => {
              dispatch(increment())
            }}
          >
            Incremet
          </button>
        </div>
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Model3D</h1>

          <Model className="w-full h-full bg-purple-500 bg-opacity-50 rounded-xl text-center">
            <source
              src="/src/assets/FlightHelmet.usdz"
              type="model/vnd.usdz+zip"
            ></source>
          </Model>

          {/* <SpatialModel webViewID='testModel' className='w-full h-full bg-white bg-opacity-50' spatialStyle={{ position: { z: 0} }}>
          </SpatialModel> */}
        </div>
      </div>

      <div className="text-white m-10">{children}</div>
      <div className="flex text-white h-64 m-10">
        <SpatialDiv
          className="p-5 m-4 flex-1 bg-red-600 bg-opacity-50 rounded-xl text-center h-64 "
          spatialStyle={{ position: { z: 100 } }}
        >
          {' '}
          red
        </SpatialDiv>
        <SpatialDiv
          className="p-5 m-4 flex-1 bg-blue-600 bg-opacity-50 rounded-xl text-center h-64 "
          spatialStyle={{ position: { z: 50 } }}
        >
          {' '}
          blue
        </SpatialDiv>
        <SpatialDiv
          className="p-5 m-4 flex-1 bg-green-600 bg-opacity-50 rounded-xl text-center h-64"
          spatialStyle={{ position: { z: 25 } }}
        >
          {' '}
          green
        </SpatialDiv>
        <SpatialDiv
          className="p-5 m-4 flex-1 bg-purple-600 bg-opacity-50 rounded-xl text-center h-64"
          spatialStyle={{ position: { z: 10 } }}
        >
          {' '}
          purple
        </SpatialDiv>
      </div>

      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
        </div>
      </div>
      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
        </div>
      </div>
      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
        </div>
      </div>
      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
        </div>
      </div>
    </>
  )
}

var session = getSession()
if (session) {
  session!
    .getCurrentWindowComponent()
    .setStyle({ material: { type: 'default' }, cornerRadius: 70 })
  document.documentElement.style.backgroundColor = 'transparent'
  document.body.style.backgroundColor = 'transparent'
} else {
  document.documentElement.style.backgroundColor = 'gray'
  document.body.style.backgroundColor = 'gray'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <div>
        <App />
      </div>
    </Provider>
  </React.StrictMode>,
)
