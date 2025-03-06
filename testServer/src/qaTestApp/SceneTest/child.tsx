// @ts-nocheck
import React, { useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@webspatial/core-sdk'
// import { initScene } from '@webspatial/react-sdk'
window.xrCurrentSceneDefaults = async config => {
  // const config = await requestDatabase()
  return {
    defaultSize: {
      width: 900,
      height: 100,
    }, //config.defaultSize,
    resizability: 'contentSize',
  }
}
const btnCls =
  'p-2 border border-gray-700 hover:text-white bg-gray-700 hover:bg-blue-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'
const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

if (spatialSupported) {
  var session = new Spatial().requestSession()
  session!.getCurrentWindowComponent().setStyle({
    material: { type: 'default' },
    cornerRadius: 50,
  })
}

function App() {
  const [windowRefs, setWindowRefs] = useState({
    winARef: useRef<any>(null),
    winBRef: useRef<any>(null),
    winCRef: useRef<any>(null),
    winDRef: useRef<any>(null),
    winERef: useRef<any>(null),
    winFRef: useRef<any>(null),
  })

  const handleOpenWindow = (
    ref: React.MutableRefObject<any>,
    url: string,
    sceneName: string,
  ) => {
    ref.current = window.open(url, sceneName)
  }
  // const handleOpenWindow = async (ref: React.MutableRefObject<any>, url: string, sceneName: string) => {
  //   await initScene(sceneName, defaultConfig => defaultConfig)
  //   ref.current = window.open(url, sceneName)
  // }
  const handleCloseWindow = (windowRef: React.MutableRefObject<any>) => {
    try {
      if (!windowRef.current) {
        console.log('no window')
        return
      }
      if (windowRef.current?.closed) {
        console.log('is already closed')
      } else {
        windowRef.current?.close?.()
        console.log('close success')
      }
    } catch (error: any) {
      console.log(error.message)
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
          Window Group
        </div>
      </h1>
      {/* Navigation Bar */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a href="/" className="hover:text-blue-400 transition-colors">
          Return to Home Page
        </a>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] ">
        {/*<div >*/}
        {/* Button Group A */}
        <div className="flex items-center">
          <button
            className={btnCls}
            onClick={() => {
              console.log('Start executing the operation to open winA')
              handleOpenWindow(
                windowRefs.winARef,
                'http://localhost:5173/src/qaTestApp/domapiTest/domapi1.html',
                'sa',
              )
            }}
          >
            open winA
          </button>
          <div className="w-4"></div>
          <button
            className={btnCls}
            onClick={() => handleCloseWindow(windowRefs.winARef)}
          >
            close winA
          </button>
        </div>
        {/* Button Group B */}
        {/*<div className="flex items-center mt-4">*/}
        {/*<button*/}
        {/*  className={btnCls}*/}
        {/*  onClick={() => {*/}
        {/*    initScene('sb', () => ({*/}
        {/*      defaultSize: {*/}
        {/*        width: 300,*/}
        {/*        height: 500,*/}
        {/*      },*/}
        {/*      resizability: 'automatic'*/}
        {/*    }))*/}
        {/*    handleOpenWindow(*/}
        {/*      windowRefs.winBRef,*/}
        {/*      'http://localhost:5173/src/qaTestApp/domapiTest/domapi1.html','sb'*/}
        {/*    )*/}
        {/*  }}*/}
        {/*>*/}
        {/*  open winB*/}
        {/*</button>*/}
        {/*  <div className="w-4"></div>*/}
        {/*  <button*/}
        {/*    className={btnCls}*/}
        {/*    onClick={() => handleCloseWindow(windowRefs.winBRef)}*/}
        {/*  >*/}
        {/*    close winB*/}
        {/*  </button>*/}
        {/*</div>*/}
        {/* Button Group C */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() =>
              handleOpenWindow(
                windowRefs.winCRef,
                'http://localhost:5173/src/qaTestApp/SceneTest/model.html',
                'sc',
              )
            }
          >
            open model
          </button>
          <div className="w-4"></div>
          <a
            href="http://localhost:5173/src/qaTestApp/SceneTest/model.html"
            target="_blank"
            className={btnCls}
          >
            open model by a tag
          </a>
          <div className="w-4"></div>
          <button
            className={btnCls}
            onClick={() => handleCloseWindow(windowRefs.winCRef)}
          >
            close model
          </button>
        </div>
        {/* Button Group D */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() =>
              handleOpenWindow(windowRefs.winDRef, 'http://google.com', 'sd')
            }
          >
            open google
          </button>
          <div className="w-4"></div>
          <button
            className={btnCls}
            onClick={() => handleCloseWindow(windowRefs.winDRef)}
          >
            close google
          </button>
        </div>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
