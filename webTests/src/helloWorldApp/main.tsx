import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import hnLogo from './assets/y18.svg'
import { Model, SpatialIFrame, getSessionAsync } from '../../lib/webSpatialComponents'

import { Provider } from 'react-redux'
import { initMessageListener } from 'redux-state-sync';
import { useDispatch, useSelector } from "react-redux";
import store, { increment } from "./store.ts"
initMessageListener(store);

function App() {
  const [count, setCount] = useState(0)
  const sharedCount = useSelector((state: any) => state.count.value);
  const dispatch = useDispatch()
  const [created, setCreated] = useState(false)
  //var volumetricWG = new WindowGroup()
  //var volumetricPanel = new WebPanel()


  const children = [];
  for (var i = sharedCount - 1; i >= 0; i -= 1) {
    children.push(
      <SpatialIFrame src="/index.html?pageName=reactDemo/basic.tsx" key={i} className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-4" spatialOffset={{ z: 100 }}>
      </SpatialIFrame>
    );
  };
  var goHome = () => {
    history.go(-1)
  }
  return (
    <>
      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
          <a href="#" onClick={goHome}>Go Back</a>
        </div>
      </div>

      <div className="flex text-white">
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Toggle Immersive</h1>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" onChange={async (e) => {
              // if (e.target.checked) {
              //   await WebSpatial.openImmersiveSpace()
              //   if (!created) {
              //     setCreated(true)

              //     let helmetModel = await WebSpatial.createResource("ModelComponent", WebSpatial.getImmersiveWindowGroup(), { modelURL: "http://testIP:5173/src/assets/FlightHelmet.usdz" });
              //     var ent = await WebSpatial.createEntity(WebSpatial.getImmersiveWindowGroup())
              //     WebSpatial.setComponent(ent, helmetModel)
              //     WebSpatial.onFrame(async (x: number) => {

              //       ent.position.x = Math.sin(x / 1000)
              //       ent.position.y = 1.5
              //       ent.position.z = -1
              //       WebSpatial.updateEntityPose(ent)
              //     })
              //   }
              // } else {
              //   await WebSpatial.dismissImmersiveSpace()
              // }
            }}></input>
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Open Volumetric</h1>
          <button className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async (e) => {
              // if (volumetricWG.id === "") {
              //   volumetricWG = await WebSpatial.createWindowGroup("Volumetric")
              //   await new Promise(resolve => setTimeout(resolve, 500));
              //   // volumetricPanel = await WebSpatial.createWebPanel(volumetricWG, "/index.html?pageName=helloWorldApp/main2.tsx")
              //   // await WebSpatial.updatePanelPose(volumetricWG, volumetricPanel, { x: 0, y: 0, z: -0.4 }, 1920, 1080)
              //   // await WebSpatial.createMesh(volumetricWG, "myMesh")
              //   // await WebSpatial.createDOMModel(volumetricWG, volumetricPanel, "testModel", "http://testIP:5173/src/assets/FlightHelmet.usdz")
              //   // setTimeout(() => {
              //   //   WebSpatial.updateDOMModelPosition(volumetricWG, volumetricPanel, "testModel", { x: 0, y: -0.5, z: 0 })
              //   // }, 3000);
              // }



            }}>
            Click Me</button>
          <input type="range" step='0.005' className="mt-10 w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
            // style={{ height: "30px" }}
            onChange={async (e) => {
              // WebSpatial.updatePanelPose(volumetricWG, volumetricPanel, { x: (Number(e.target.value) / 100), y: 0, z: -0.4 }, 1920, 1080)
              // await WebSpatial.updateDOMModelPosition(volumetricWG, volumetricPanel, "testModel", { x: -(Number(e.target.value) / 100), y: -0.5, z: 0 })
              // //   await WebSpatial.updateDOMModelPosition("root", "root", "testModel", { x: Math.floor(Number(e.target.value) * 3) + 200, y: 300, z: 0 })
            }}></input>

        </div>
        <div className="select-none p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Open Plain</h1>
          <button className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async (e) => {
              // var newPage = await WebSpatial.createWindowGroup("Plain")
              // await WebSpatial.createWebPanel(newPage, "/index.html?pageName=helloWorldApp/main2.tsx")
            }}>
            Click Me
          </button>
          <h1>test: {sharedCount}</h1>
          <button className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async (e) => {
              dispatch(increment())
            }}>
            Incremet
          </button>
        </div>
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Model3D</h1>

          <Model className="w-full h-full bg-purple-500 bg-opacity-50 rounded-xl text-center">
            <source src="http://testIP:5173/src/assets/FlightHelmet.usdz" type="model/vnd.usdz+zip" ></source>
          </Model>

          {/* <SpatialModel webViewID='testModel' className='w-full h-full bg-white bg-opacity-50' spatialOffset={{ z: 0 }}>
          </SpatialModel> */}
        </div>
      </div>

      <div className="text-white m-10">
        {children}
      </div>
      <div className="flex text-white h-64 m-10">
        <SpatialIFrame src="/index.html?pageName=reactDemo/basic.tsx" className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 100 }}>
        </SpatialIFrame>
        <SpatialIFrame src="/index.html?pageName=reactDemo/basic.tsx" className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 50 }}>

        </SpatialIFrame>
        <SpatialIFrame src="/index.html?pageName=reactDemo/basic.tsx" className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 25 }}>

        </SpatialIFrame>
        <SpatialIFrame src="/index.html?pageName=reactDemo/basic.tsx" className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center h-64" spatialOffset={{ z: 10 }}>

        </SpatialIFrame>
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

// WebSpatial.updateResource(WebSpatial.getCurrentWebPanel(), { style: { glassEffect: true, cornerRadius: 50 } })
await (await getSessionAsync()).getCurrentIFrameComponent().setStyle({ glassEffect: true, cornerRadius: 50 })
document.documentElement.style.backgroundColor = "transparent";
document.body.style.backgroundColor = "transparent"
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <div>
        <App />
      </div>
    </Provider>
  </React.StrictMode >,
)



var main = async () => {
}
main()
