import React, { useEffect, useRef, useState } from 'react'
import { Spatial } from '@webspatial/core-sdk'
import { initScene, enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

const btnCls =
  'select-none px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 hover:text-white bg-gray-800 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-all'

const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

const extUrl = 'https://www.google.com/'
const extUrl2 = 'https://developer.mozilla.org/zh-CN/'

export default function SceneTest() {
  const [logs, setLogs] = useState('')

  function logDepth() {
    //@ts-ignore
    log(
      'xrInnerDepth:' + window.xrInnerDepth,
      'xrOuterDepth:' + window.xrOuterDepth,
    )
    //@ts-ignore
    log('outerHeight:' + window.outerHeight)
  }

  useEffect(() => {
    logDepth()
    window.onerror = (error: any) => {
      log('error:', error.message)
    }
    window.onresize = logDepth
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
      console.log(ans)
      return ans
    })
  }

  const winARef = useRef<any>(null)
  const winBRef = useRef<any>(null)
  const winCRef = useRef<any>(null)

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-8">Scene & Window Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            Error Handling
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={btnCls}
              onClick={async () => {
                startlog('open')
                initScene(
                  'sa',
                  () => ({
                    defaultSize: {
                      width: '10cm',
                      height: 1000,
                      depth: 100,
                    },
                  }),
                  { type: 'volume' },
                )
                winARef.current = window.open('/#/scene/volume', 'sa')
              }}
            >
              Invalid Unit Test
            </button>

            <button
              className={btnCls}
              onClick={async () => {
                startlog('open')
                initScene(
                  'sv-valid-m',
                  () => ({
                    defaultSize: {
                      width: '0.1m',
                      height: 1,
                      depth: 1,
                    },
                  }),
                  { type: 'volume' },
                )
                winARef.current = window.open('/#/scene/volume', 'sv-valid-m')
              }}
            >
              Valid Unit Test (meters)
            </button>

            <button
              className={btnCls}
              onClick={async () => {
                startlog('open')
                initScene(
                  'sv-valid-px',
                  () => ({
                    defaultSize: {
                      width: 100,
                      height: 1000,
                      depth: 100,
                    },
                  }),
                  { type: 'volume' },
                )
                winARef.current = window.open('/#/scene/volume', 'sv-valid-px')
              }}
            >
              Valid Unit Test (px)
            </button>
          </div>
        </section>

        <section className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            Volume Tests
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={btnCls}
              onClick={async () => {
                startlog('open')
                initScene(
                  'sv',
                  () => ({
                    defaultSize: { width: 1000, height: 1000, depth: 500 },
                    resizability: {
                      minWidth: 1000,
                      maxWidth: 2000,
                      minHeight: 1000,
                      maxHeight: 2000,
                    },
                  }),
                  { type: 'volume' },
                )
                winARef.current = window.open('/#/reality', 'sv')
              }}
            >
              Open Volume (sv)
            </button>

            <button
              className={btnCls}
              onClick={() => window.open('/pages/scene/volumeHook.html', 'sv')}
            >
              Open Volume Hook (sv)
            </button>
          </div>
        </section>

        <section className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            External URLs
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={btnCls}
              onClick={() => window.open(extUrl, 'sa')}
            >
              Google
            </button>
            <button
              className={btnCls}
              onClick={() => window.open(extUrl2, 'sa')}
            >
              MDN
            </button>
            {/* Click the nested image to reproduce anchor bubbling behavior in the polyfill. */}
            <a
              className={`${btnCls} inline-flex items-center gap-2`}
              href="/#/reality"
              target="sv"
              rel="noreferrer"
            >
              <img
                alt="nested link icon"
                className="w-4 h-4 rounded-sm"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%234B5563'/%3E%3Cpath d='M5 8h6M8 5l3 3-3 3' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
              />
              <span>Nested Anchor Click</span>
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Click the icon inside Nested Anchor Click to simulate a nested
            target inside an anchor tag.
          </p>
        </section>

        <section className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            Window Tests
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={btnCls}
              onClick={() => {
                startlog('open')
                winARef.current = window.open('/#/scene/xrapp')
              }}
            >
              Open No config window
            </button>
            <button
              className={btnCls}
              onClick={() => {
                startlog('open')
                // Open A (sa)
                initScene('sa', () => ({
                  defaultSize: { width: 900, height: 500 },
                }))
                winARef.current = window.open('/#/scene/xrapp', 'sa')
              }}
            >
              Open A (sa)
            </button>
            <button
              className={btnCls}
              onClick={() => {
                startlog('open')
                winBRef.current = window.open('/#/scene/xrapp', 'sb')
              }}
            >
              Open B (sb)
            </button>
            <button
              className={btnCls}
              onClick={() => {
                startlog('open')
                winARef.current = window.open('/pages/scene/hook.html')
              }}
            >
              Open Window Hook
            </button>
            <button
              className={btnCls}
              onClick={() => {
                // Open loading demo page in window
                startlog('open')
                winARef.current = window.open('/pages/scene/loading.html')
              }}
            >
              Open Loading
            </button>

            <button
              className={btnCls}
              onClick={() => {
                startlog('open')
                winARef.current = window.open('/#/scene/xrapp', 'sa')
                winBRef.current = window.open(extUrl, 'sb')
              }}
            >
              Open A + B
            </button>
            <button
              className={btnCls}
              onClick={() => {
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
              Close A
            </button>
            <button
              className={btnCls}
              onClick={() => {
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
              Close B
            </button>
            <button
              className={btnCls}
              onClick={() => {
                startlog('focus')
                try {
                  if (!winARef.current) {
                    log('no window')
                    return
                  }
                  winARef.current?.focus?.()
                  log('focus success')
                } catch (error: any) {
                  log(error.message)
                }
              }}
            >
              Focus A
            </button>
            <button
              className={btnCls}
              onClick={() => {
                //@ts-ignore
                log('windowID:', window._webSpatialID)
              }}
            >
              Get window._webSpatialID
            </button>
          </div>
        </section>

        <section className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            Console
          </h2>
          <pre className="text-xs bg-black/40 p-4 rounded-lg h-40 overflow-auto font-mono">
            {logs}
          </pre>
        </section>
      </div>
    </div>
  )
}
