import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import { SpatialWeb } from "../../lib/spatialWeb.ts"
import hnLogo from './assets/y18.svg'

import { Provider } from 'react-redux'
import { initMessageListener } from 'redux-state-sync';
import { useDispatch, useSelector } from "react-redux";
import store, { increment } from "./store.ts"
initMessageListener(store);

import WebSpatial from "../../lib/webSpatial.ts"

// function App() {
//   const [isLoaded, setIsLoaded] = useState(false)
//   const [stories, setStories] = useState([] as Array<{ title: string }>)


//   useEffect(() => {
//     console.log("effect hit");
//     (async () => {
//       var r = await fetch('https://hacker-news.firebaseio.com/v0/askstories.json?print=pretty');
//       var x = await r.json();

//       var list = []
//       for (var i = 0; i < 5; i++) {
//         var s = await fetch('https://hacker-news.firebaseio.com/v0/item/' + x[i] + '.json?print=pretty');
//         var sj = await s.json()
//         list.push(sj)
//       }

//       setIsLoaded(true)
//       setStories(list)
//     })();
//   }, [])

//   const listItems = stories.map((story: any) =>
//     <div className='p-2'>
//       <button className='p-3 w-full bg-white bg-opacity-25 rounded-xl shadow-lg flex flex-row items-left space-x-4'>
//         <div className='basis-3/4'>
//           <div className="text-xl font-medium text-white text-left">{story.title}</div>
//           {/* <p className="text-white">You have a new message!</p> */}
//         </div>
//         <div className="basis-1/4">
//           {/* <img className="h-12 w-12" src="/img/logo.svg" alt="ChitChat Logo"></img> */}
//           <button className="bg-white bg-opacity-25 hover:bg-gray-100 text-white-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow text-white">
//             Comments
//           </button>
//         </div>
//       </button>
//     </div>

//   );
//   return (
//     <div className="p-4">
//       <header className="w-full shadow-sm body-font">
//         <div className="container flex flex-col flex-wrap items-left p-1 mx-auto md:flex-row">
//           <div
//             className="flex items-left order-first mb-4 font-medium text-gray-900 lg:order-none lg:w-1/5 title-font lg:items-left lg:justify-center md:mb-0">
//             <img src={hnLogo} className="h-10 w-10" alt="HN logo" />
//             <h1 className='text-white text-3xl mx-3 my-1'>Hacker news</h1>
//           </div>
//         </div>
//       </header>
//       {listItems}
//       {stories.length <= 0 ?
//         <div className="p-6">
//           <div className="mb-2 p-6 max-w-full mx-auto bg-white bg-opacity-25 rounded-xl shadow-lg flex items-center space-x-4">
//             <div>
//               <div className="text-xl font-medium text-black">Loading</div>
//             </div>
//           </div>
//         </div> : <></>}
//     </div>
//   )
// }


function App() {
  const [count, setCount] = useState(0)
  const sharedCount = useSelector((state: any) => state.count.value);
  const dispatch = useDispatch()

  return (
    <>
      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
        </div>
      </div>

      <div className="flex text-white">
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Toggle Immersive</h1>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" onChange={async (e) => {
              if (e.target.checked) {
                await WebSpatial.openImmersiveSpace()
              } else {
                await WebSpatial.dismissImmersiveSpace()
              }
            }}></input>
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Open Volumetric</h1>
          <button className="px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async (e) => {
              await WebSpatial.createWindowGroup("myWindow", "Volumetric")
              await new Promise(resolve => setTimeout(resolve, 500));
              await WebSpatial.createWebPanel("myWindow", "myPanel2", "/index.html?pageName=helloWorldApp/main2.tsx")
              await WebSpatial.createMesh("myWindow", "myMesh")
            }}>
            Click Me</button>
          <input type="range" step='0.005' className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            onChange={async (e) => {
              WebSpatial.updatePanelPose("myWindow", "myPanel2", (Number(e.target.value) / 100).toString())
              await WebSpatial.log(e.target.value)
            }}></input>

        </div>
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Open Plain</h1>
          <button className="px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async (e) => {
              await WebSpatial.createWindowGroup("myWindow2", "Plain")
              await WebSpatial.createWebPanel("myWindow2", "myPanel", "/index.html?pageName=helloWorldApp/main2.tsx")
            }}>
            Click Me
          </button>
          <h1>test: {sharedCount}</h1>
          <button className="px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={async (e) => {
              dispatch(increment())
            }}>
            Incremet
          </button>
        </div>
      </div>
    </>
  )
}

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

  const bc = new BroadcastChannel("test_channel");
  bc.postMessage("This is a test message.");

  bc.onmessage = (event) => {
    console.log(event);
    WebSpatial.log("GOT ON MESSAGE")
  };

  // await WebSpatial.createWindowGroup("myWindow2", "Plain")
  // await WebSpatial.createWebPanel("myWindow2", "myPanel", "http://localhost:5173/index2.html")


  // await WebSpatial.createWindowGroup("myWindow", "Volumetric")

  // await new Promise(resolve => setTimeout(resolve, 500));
  // await WebSpatial.createWebPanel("myWindow", "myPanel2", "http://localhost:5173/index2.html")

  // await WebSpatial.createMesh("myWindow", "myMesh")

  // await WebSpatial.log("Webpage loaded")
  // await WebSpatial.openImmersiveSpace()

  // await new Promise(resolve => setTimeout(resolve, 1000));
  // await WebSpatial.dismissImmersiveSpace()


  // WebSpatial.onFrame((time: number) => {
  //   var x = Math.sin(time / 1000)
  //   WebSpatial.updatePanelPose("myWindow", "myPanel2", x.toString())
  // })

  // setTimeout(() => {
  //   (window as any).webkit.messageHandlers.bridge.postMessage('{"msg": "hello?","id": ' + Date.now() + '}');
  //   (window as any).webkit.messageHandlers.bridge.postMessage('{"msg": "hello2?","id": ' + Date.now() + '}');
  //   //(window as any).webkit.messageHandlers.iosListener.postMessage('click clack!');
  //   console.log("hit")
  //   document.body.style.backgroundColor = '#ff634722'
  // }, 1000);
  // SpatialWeb.init()
  // console.log("webpage start")
  // // Get 3D window reference
  // var spatialWindow = await SpatialWeb.getCurrentSpatialWindow()

  // // Set resolution
  // spatialWindow.resolution.x = 1920 / 3
  // spatialWindow.resolution.y = 1080

  // // Set scale to avoid squishing based on resultion
  // let scaleFactor = 0.5
  // spatialWindow.scale.x = (spatialWindow.resolution.x / spatialWindow.resolution.y) * scaleFactor
  // spatialWindow.scale.y = 1 * scaleFactor
  // spatialWindow.scale.z = 1 * scaleFactor

  // // Position at the bottom of the volume
  // spatialWindow.position.x = 0
  // spatialWindow.position.y = -0.5 + (spatialWindow.scale.y / 2)
  // spatialWindow.position.z = 0.3 // bring closer to user

  // spatialWindow.updateTransform()


  // SpatialWeb.onFrame((curTime: number) => {
  //   spatialWindow.position.z = Math.sin(curTime / 1000) * 0.5
  //   spatialWindow.updateTransform()
  // })

  // var spatialWindow2 = await SpatialWeb.createNewSpatialWindow("/index2.html")
  // // Set resolution
  // spatialWindow2.resolution.x = 1920
  // spatialWindow2.resolution.y = 1080


  // // Set scale to avoid squishing based on resultion
  // scaleFactor = 0.2
  // spatialWindow2.scale.x = (spatialWindow2.resolution.x / spatialWindow2.resolution.y) * scaleFactor
  // spatialWindow2.scale.y = 1 * scaleFactor
  // spatialWindow2.scale.z = 1 * scaleFactor

  // // Position at the bottom of the volume
  // spatialWindow2.position.x = 0.1
  // spatialWindow2.position.y = -0.5 + (spatialWindow2.scale.y / 2)
  // spatialWindow2.position.z = 0.4 // bring closer to user
  // spatialWindow2.updateTransform()
  // //setTimeout(() => {
  // spatialWindow2.openUrl("/index2.html")
  // //}, 100);

  // SpatialWeb.onFrame((curTime: number) => {
  //   spatialWindow2.position.y = Math.sin(curTime / 1000) * 0.5
  //   spatialWindow2.updateTransform()
  // })

  //document.body.style.backgroundColor = '#ff634722'



}
main()
