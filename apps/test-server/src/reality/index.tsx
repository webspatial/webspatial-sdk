import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { getSession, initScene } from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

const extUrl = 'https://www.google.com/'
const extUrl2 = 'https://developer.mozilla.org/zh-CN/'
function App() {
  const [logs, setLogs] = useState('')

  useEffect(() => {
    //@ts-ignore
    log('windowID:', window._webSpatialID)
    window.onerror = (error: any) => {
      log('error:', error.message)
    }

    return () => {
      window.onerror = null
    }
  }, [])

  function startlog(str: string) {
    setLogs(str)
  }

  function log(...args: any[]) {
    setLogs(pre => {
      let ans = pre + '\n'
      for (let i = 0; i < args.length; i++) {
        if (typeof args[i] === 'object') {
          ans += JSON.stringify(args[i])
        } else {
          ans += args[i]
        }
      }
      return ans
    })
  }

  const winARef = useRef<any>(null)
  const winBRef = useRef<any>(null)
  const winCRef = useRef<any>(null)

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">openscene</h1>

      <button
        className={btnCls}
        onClick={async () => {
          const session = getSession()!
          const reality = await session.createSpatializedDynamic3DElement()
          const spatialScene = session.getSpatialScene()
          await spatialScene.addSpatializedElement(reality)
        }}
      >
        create reality
      </button>

        <button
        className={btnCls}
        onClick={async () => {
          const session = getSession()!
          const entity = await session.createSpatialEntity()
        }}
      >
        create entity
      </button>

      <div>
        <div>console</div>
        <p style={{ fontSize: '46px' }}>{logs}</p>
      </div>
    </div>
  )
}

// Initialize react
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
