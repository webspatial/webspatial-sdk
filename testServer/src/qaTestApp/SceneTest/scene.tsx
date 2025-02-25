import React, { useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { SpatialDiv } from '@xrsdk/react/dist'
import { Spatial } from '@xrsdk/runtime'
import { initScene } from '@xrsdk/react'

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
  const winARef = useRef<any>(null)
  const winBRef = useRef<any>(null)
  const winCRef = useRef<any>(null)
  const winDRef = useRef<any>(null)
  const winERef = useRef<any>(null)
  const winFRef = useRef<any>(null)

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
    } catch (error: any) {
      console.log(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-44">
      <h1 style={{ textAlign: 'center', fontSize: '36px' }}>
        <SpatialDiv
          spatialStyle={{
            position: { z: 100 }, // z方向凸起50
          }}
          className="text-6xl font-bold text-white p-8 rounded-xl"
        >
          Window Group
        </SpatialDiv>
      </h1>
      {/* Navigation Bar */}
      <div className="flex text-white text-lg bg-black bg-opacity-25 p-4 gap-5 mb-4">
        <a href="/" className="hover:text-blue-400 transition-colors">
          返回主页
        </a>
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="hover:text-blue-400 transition-colors"
        >
          返回上一级
        </a>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] ">
        {/*<div >*/}
        {/* 按钮组A */}
        <div className="flex items-center">
          <button
            className={btnCls}
            onClick={() => {
              console.log('开始执行打开 winA 操作')
              winARef.current = window.open(
                'http://localhost:5173/src/qaTestApp/domapiTest/domapi1.html',
                'sa',
              )
            }}
          >
            open winA
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winARef)}>
            close winA
          </button>
        </div>
        {/* 按钮组B */}
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
              console.log('开始执行打开 winB 操作')
              winBRef.current = window.open(
                'http://localhost:5173/src/qaTestApp/domapiTest/domapi1.html',
                'sb',
              )
            }}
          >
            open winB
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winBRef)}>
            close winB
          </button>
        </div>
        {/* 按钮组C */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() => {
              console.log('开始执行打开 winC 操作')
              winCRef.current = window.open(
                'http://localhost:5173/src/qaTestApp/SceneTest/model.html',
                'sc',
              )
            }}
          >
            open model
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
            close model
          </button>
        </div>
        {/* 按钮组D */}
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
              console.log('开始执行打开 winD 操作')
              winDRef.current = window.open(
                'http://localhost:5173/src/qaTestApp/SceneTest/child.html',
                'sd',
              )
            }}
          >
            open child by initScene
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winDRef)}>
            close child by initScene
          </button>
        </div>
        {/* 按钮组E */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() => {
              console.log('开始执行打开 winE 操作')
              winERef.current = window.open(
                'http://localhost:5173/src/qaTestApp/SceneTest/child.html',
                'sd',
              )
            }}
          >
            open child
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winERef)}>
            close child
          </button>
        </div>
        {/* 按钮组F */}
        <div className="flex items-center mt-4">
          <button
            className={btnCls}
            onClick={() =>
              (winFRef.current = window.open('http://google.com', 'sf'))
            }
          >
            open google
          </button>
          <div className="w-4"></div>
          <button className={btnCls} onClick={() => handleCloseWindow(winFRef)}>
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

// const root = ReactDOM.createRoot(document.getElementById('root')!)
// root.render(<App />)
