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
  const [created, setCreated] = useState(false)

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
                if (!created) {
                  setCreated(true)
                  await WebSpatial.createDOMModel("Immersive", "x", "testModel", "http://testIP:5173/src/assets/FlightHelmet.usdz")
                  WebSpatial.onFrame(async (x: number) => {
                    WebSpatial.updateDOMModelPosition("Immersive", "x", "testModel", { x: Math.sin(x / 1000), y: 1.5, z: -1 })
                  })
                }
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
              await WebSpatial.createDOMModel("myWindow", "myPanel2", "testModel", "http://testIP:5173/src/assets/FlightHelmet.usdz")
              setTimeout(() => {
                WebSpatial.updateDOMModelPosition("myWindow", "myPanel2", "testModel", { x: 0, y: -0.5, z: 0 })
              }, 1000);

            }}>
            Click Me</button>
          <input type="range" step='0.005' className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            onChange={async (e) => {
              WebSpatial.updatePanelPose("myWindow", "myPanel2", { x: (Number(e.target.value) / 100), y: 0, z: 0 })
              await WebSpatial.updateDOMModelPosition("myWindow", "myPanel2", "testModel", { x: -(Number(e.target.value) / 100), y: -0.5, z: 0 })
              //   await WebSpatial.updateDOMModelPosition("root", "root", "testModel", { x: Math.floor(Number(e.target.value) * 3) + 200, y: 300, z: 0 })
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
        <div className="p-5 m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Model3D</h1>
          <div id="modelHere" className='w-full h-full bg-white bg-opacity-50'>

          </div>
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
      <div className="flex text-white">
        <div className="text-xl p-20  m-4 flex-1 bg-white bg-opacity-5 rounded-xl text-center">
          <h1>Hello Web Spatial</h1>
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
  setTimeout(async () => {
    var element = document.getElementById("modelHere")!
    var rect = element.getBoundingClientRect();
    var curPosX = (rect.left + ((rect.right - rect.left) / 2))
    var curPosY = (rect.bottom + ((rect.top - rect.bottom) / 2))
    await WebSpatial.createDOMModel("root", "root", "testModel", "http://testIP:5173/src/assets/FlightHelmet.usdz")
    await WebSpatial.updateDOMModelPosition("root", "root", "testModel", { x: curPosX, y: curPosY, z: 0 })

    {
      WebSpatial.onFrame(async () => {
        var element = document.getElementById("modelHere")!
        var rect = element.getBoundingClientRect();
        var targetPosX = (rect.left + ((rect.right - rect.left) / 2))
        var targetPosY = (rect.bottom + ((rect.top - rect.bottom) / 2))
        curPosX = Math.floor(curPosX + ((targetPosX - curPosX) * 0.3))
        curPosY = Math.floor(curPosY + ((targetPosY - curPosY) * 0.3))
        await WebSpatial.updateDOMModelPosition("root", "root", "testModel", { x: curPosX, y: curPosY, z: 0 });
      })
    }

  }, 100);



}
main()
