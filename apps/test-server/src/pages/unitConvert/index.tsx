import React, { useEffect, useRef, useState } from 'react'
import { Spatial } from '@webspatial/core-sdk'
import { initScene, enableDebugTool } from '@webspatial/react-sdk'
import { usePhysicalMetrics } from '@webspatial/react-sdk'
enableDebugTool()

const btnCls =
  'select-none px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 hover:text-white bg-gray-800 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-all'

const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

const extUrl = 'https://www.google.com/'
const extUrl2 = 'https://developer.mozilla.org/zh-CN/'

export default function UnitConvertTest() {
  const { point2physical, physical2point } = usePhysicalMetrics()
  const [logs, setLogs] = useState('')

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

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-8">Unit Convert Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            scaled
          </h2>

          <pre className="text-xs bg-black/40 p-4 rounded-lg h-40 overflow-auto font-mono">
            physical2point(1):{physical2point(1)} <br />
            point2physical(1):{point2physical(1)}
          </pre>

          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            unscaled
          </h2>

          <pre className="text-xs bg-black/40 p-4 rounded-lg h-40 overflow-auto font-mono">
            physical2point(1):
            {physical2point(1, { worldScalingCompensation: 'unscaled' })} <br />
            point2physical(1):
            {point2physical(1, { worldScalingCompensation: 'unscaled' })}
          </pre>
          <button
            className="btn btn-primary"
            onClick={() => {
              window.__physicalMetrics = {
                meterToPtScaled: 1360,
                meterToPtUnscaled: 1500 + ((Math.random() * 100) >> 0),
              }
              window.dispatchEvent(new Event('physicalMetricsUpdate'))
            }}
          >
            trigger random update
          </button>
          {/* <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            Console
          </h2>
          <pre className="text-xs bg-black/40 p-4 rounded-lg h-40 overflow-auto font-mono">
            {logs}
          </pre> */}
        </section>
      </div>
    </div>
  )
}
