// @ts-nocheck
import React, { useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@webspatial/core-sdk'
import { initScene } from '@webspatial/react-sdk'

const btnCls =
  'p-2 border border-gray-700 hover:text-white bg-gray-700 hover:bg-blue-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'
const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

if (spatialSupported) {
  const session = new Spatial().requestSession()
  session!.getCurrentWindowComponent().setStyle({
    material: { type: 'default' },
    cornerRadius: 50,
  })
}

function App() {
  const winARef = useRef<Window | null>(null)
  const winBRef = useRef<Window | null>(null)
  const winCRef = useRef<Window | null>(null)
  const winDRef = useRef<Window | null>(null)
  const winERef = useRef<Window | null>(null)
  const winFRef = useRef<Window | null>(null)

  const handleCloseWindow = (
    windowRef: React.MutableRefObject<Window | null>,
  ) => {
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
    } catch (error) {
      console.log((error as Error).message)
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
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          Go Back
        </a>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] ">
        {/* Button Group A */}
        <div className="flex items-center">
          <button
            className={btnCls}
            onClick={() => {
              console.log('Start the operation to open winA')
              winARef.current = window.open(
                'http://localhost:5173/src/qaTestApp/domapiTest/domapi1.html',
                'sa',
              )
            }}
          >
            Open winA
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winARef)}>
            Close winA
          </button>
        </div>
        {/* Button Group B */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() => {
              initScene('sb', () => ({
                defaultSize: {
                  width: 2000,
                  height: 500,
                },
                resizability: 'automatic',
              }))
              console.log('Start the operation to open winB')
              winBRef.current = window.open(
                'http://localhost:5173/src/qaTestApp/domapiTest/domapi1.html',
                'sb',
              )
            }}
          >
            Open winB
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winBRef)}>
            Close winB
          </button>
        </div>
        {/* Button Group C */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() => {
              console.log('Start the operation to open winC')
              winCRef.current = window.open(
                'http://localhost:5173/src/qaTestApp/SceneTest/model.html',
                'sc',
              )
            }}
          >
            Open Model
          </button>
          {/*<div className="w-4"></div>*/}
          {/*<a*/}
          {/*  href="http://localhost:5173/src/qaTestApp/SceneTest/model.html"*/}
          {/*  target="_blank"*/}
          {/*  className={btnCls}*/}
          {/*>*/}
          {/*  open model by a tag*/}
          {/*</a>*/}
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winCRef)}>
            Close Model
          </button>
        </div>
        {/* Button Group D */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() => {
              initScene('sd', () => ({
                defaultSize: {
                  width: 300,
                  height: 500,
                },
                resizability: 'automatic',
              }))
              console.log('Start the operation to open winD')
              winDRef.current = window.open(
                'http://localhost:5173/src/qaTestApp/SceneTest/child.html',
                'sd',
              )
            }}
          >
            Open Child by initScene
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winDRef)}>
            Close Child by initScene
          </button>
        </div>
        {/* Button Group E */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() => {
              console.log('Start the operation to open winE')
              winERef.current = window.open(
                'http://localhost:5173/src/qaTestApp/SceneTest/child.html',
                'sd',
              )
            }}
          >
            Open Child
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winERef)}>
            Close Child
          </button>
        </div>
        {/* Button Group F */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() =>
              (winFRef.current = window.open('http://google.com', 'sf'))
            }
          >
            Open Google
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winFRef)}>
            Close Google
          </button>
        </div>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
