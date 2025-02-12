import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Spatial } from '@xrsdk/runtime'
import { initScene } from '@xrsdk/react'
window.xrCurrentSceneDefaults = async config => {
  // const config = await requestDatabase()
  return {
    defaultSize: {
      width: 900,
      height: 900,
    }, //config.defaultSize,
    resizability: 'contentSize',
  }
}

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'
const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

if (spatialSupported) {
  var session = new Spatial().requestSession()
  session!.getCurrentWindowComponent().setStyle({
    material: { type: 'default' },
    cornerRadius: 50,
  })
}
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
          startlog('open no name')
          winARef.current = window.open(
            'http://localhost:5173/src/scene/xrapp.html',
            // 'http://localhost:5173/src/scene/xrapp.html',
          )
        }}
      >
        open no name
      </button>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          initScene('sa', () => ({
            defaultSize: {
              width: 900,
              height: 500,
            },
          }))
          winARef.current = window.open(
            'http://localhost:5173/src/scene/xrapp.html',
            'sa',
          )
          // winARef.current = window.open('', 'sa')
        }}
      >
        window.open with initScene
      </button>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          winARef.current = window.open(
            'http://localhost:5173/src/scene/xrapp.html',
            'sa',
            'width=800,height=600',
          )
          // winARef.current = window.open('', 'sa')
        }}
      >
        open sa
      </button>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          window.open('webspatial://createWindowContext')
        }}
      >
        open createWindowContext
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open Google')
          winARef.current = window.open(extUrl, 'sa')
        }}
      >
        open sa google
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open MDN')
          winARef.current = window.open(extUrl2, 'sa')
        }}
      >
        open sa MDN
      </button>

      <a className={btnCls} href="https://www.google.com" target="sa">
        open sa google a tag
      </a>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          winBRef.current = window.open(
            'http://localhost:5173/src/scene/xrapp.html',
            'sb',
          )
        }}
      >
        open sb xrapp
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          winBRef.current = window.open(extUrl, 'sb')
        }}
      >
        open sb google
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          winCRef.current = window.open(
            'http://localhost:5173/src/scene/xrapp.html',
            'sc',
          )
        }}
      >
        open sc
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          winARef.current = window.open(
            'http://localhost:5173/src/scene/xrapp.html',
            'sa',
          )
          winBRef.current = window.open(
            'http://localhost:5173/src/scene/xrapp.html',
            'sb',
          )
        }}
      >
        open sa+sb
      </button>

      <h1 className="text-2xl text-black">close scene by local</h1>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('close')
          try {
            if (!winARef.current) {
              log('no window')
              return
            }
            if (winARef.current?.closed) {
              log('is already closed')
            } else {
              winARef.current?.close?.()
              log('close success')
            }
          } catch (error: any) {
            log(error.message)
          }
        }}
      >
        close sa
      </button>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('close')

          try {
            if (!winBRef.current) {
              log('no window')
              return
            }
            if (winBRef.current?.closed) {
              log('is already closed')
            } else {
              winBRef.current?.close?.()
              log('close success')
            }
          } catch (error: any) {
            log(error.message)
          }
        }}
      >
        close sb
      </button>

      <h1 className="text-2xl text-black">cross test</h1>

      <button
        className={btnCls}
        onClick={async () => {
          //@ts-ignore
          log('windowID:', window._webSpatialID)
        }}
      >
        get window._webSpatialID
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
