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
    log('innerDepth:' + window.innerDepth, 'outerDepth:' + window.outerDepth)
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
          <button
            className={btnCls}
            onClick={async () => {
              startlog('open')
              initScene(
                'sa',
                () => ({
                  defaultSize: {
                    width: '10cm',
                    height: 1,
                    depth: 1,
                  },
                }),
                { type: 'volume' },
              )
              winARef.current = window.open('/src/scene/volume.html', 'sa')
            }}
          >
            Invalid Unit Test
          </button>
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
                  'sa',
                  () => ({
                    defaultSize: { width: 1, height: 1, depth: 0.1 },
                  }),
                  { type: 'volume' },
                )
                winARef.current = window.open('/src/reality/index.html', 'sa')
              }}
            >
              Open Volume
            </button>
            <button
              className={btnCls}
              onClick={async () => {
                startlog('open')
                initScene(
                  'sa',
                  () => ({
                    defaultSize: { width: 2, height: 1, depth: 1 },
                    resizability: {
                      minWidth: 0.5,
                      maxWidth: 2,
                      minHeight: 0.5,
                      maxHeight: 1,
                    },
                  }),
                  { type: 'volume' },
                )
                winARef.current = window.open('/src/scene/volume.html', 'sa')
              }}
            >
              Resizable Volume
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
