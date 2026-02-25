import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { initScene } from '@webspatial/react-sdk'

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
    <div
      /* enable-xr */
      className="pl-5 pt-2"
    >
      <h1 className="text-2xl text-black">resize</h1>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          initScene('sa', () => ({
            defaultSize: {
              width: 900,
              height: 900,
            },
            resizability: {
              minWidth: 700,
              minHeight: 700,
              // maxWidth: 900,
              // maxHeight: 900,
            },
          }))
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
            'sa',
          )
          // winARef.current = window.open('', 'sa')
        }}
      >
        window.open resizable 700-
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          initScene('sa', () => ({
            defaultSize: {
              width: 900,
              height: 900,
            },
            resizability: {
              minWidth: 700,
              minHeight: 700,
              maxWidth: 900,
              maxHeight: 900,
            },
          }))
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
            'sa',
          )
          // winARef.current = window.open('', 'sa')
        }}
      >
        window.open resizable 700-900
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          initScene('sa', () => ({
            defaultSize: {
              width: 900,
              height: 900,
            },
            resizability: {
              // minWidth: 700,
              // minHeight: 700,
              maxWidth: 900,
              maxHeight: 900,
            },
          }))
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
            'sa',
          )
          // winARef.current = window.open('', 'sa')
        }}
      >
        window.open resizable -900
      </button>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          initScene('sa', () => ({
            defaultSize: {
              width: 900,
              height: 900,
            },
            resizability: {
              minWidth: 900,
              minHeight: 900,
              maxWidth: 900,
              maxHeight: 900,
            },
          }))
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
            'sa',
          )
          // winARef.current = window.open('', 'sa')
        }}
      >
        window.open fixed size
      </button>

      <h1 className="text-2xl text-black">a tag</h1>
      <a
        className={btnCls}
        href={`http://localhost:5173/src/pages/scene/hook.html`}
      >
        open in place
      </a>
      <a
        className={btnCls}
        href={`http://localhost:5173/src/pages/scene/hook.html`}
        target="_blank"
      >
        open _blank
      </a>
      <a
        className={btnCls}
        href={`http://localhost:5173/src/pages/scene/hook.html`}
        target="_blank"
        onClick={e => {
          console.log('click on', e)
        }}
      >
        open _blank with onClick
      </a>
      <h1 className="text-2xl text-black">openscene</h1>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('open no name')
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/loading.html',
            // 'http://localhost:5173/src/scene/xrapp.html',
          )
        }}
      >
        open loading
      </button>
      <button
        className={btnCls}
        onClick={async () => {
          startlog('open no name')
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/hook.html',
            // 'http://localhost:5173/src/scene/xrapp.html',
          )
        }}
      >
        open hook
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open no name')
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
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
              height: 900,
            },
          }))
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
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
            'http://localhost:5173/src/pages/scene/xrapp.html',
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
            'http://localhost:5173/src/pages/scene/xrapp.html',
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
            'http://localhost:5173/src/pages/scene/xrapp.html',
            'sc',
          )
        }}
      >
        open sc
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('navigate to google')
          location.href = extUrl
        }}
      >
        navigate to google
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('open')
          winARef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
            'sa',
          )
          winBRef.current = window.open(
            'http://localhost:5173/src/pages/scene/xrapp.html',
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
          startlog('close self')
          try {
            window.close()
          } catch (error: any) {
            log(error.message)
          }
        }}
      >
        close self
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          startlog('close parent')
          try {
            window.opener?.close()
          } catch (error: any) {
            log(error.message)
          }
        }}
      >
        close parent
      </button>

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

export default App
