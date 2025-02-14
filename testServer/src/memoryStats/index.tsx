import React, { useEffect, useState } from 'react'
import { getSession } from '@xrsdk/react'
import { SpatialHelper } from '@xrsdk/runtime'
import ReactDOM from 'react-dom/client'

interface MemoryStats {
  backend: string
  objectCount: number
  refObjectCount: number
}

function App() {
  const [stats, setStats] = useState<MemoryStats | null>(null)

  useEffect(() => {
    // Set up window style
    ;(async () => {
      if (getSession()) {
        await getSession()
          ?.getCurrentWindowComponent()
          .setStyle({
            cornerRadius: 15,
            material: { type: 'default' },
          })
        document.body.style.backgroundColor = '#22339933'
      }
    })()

    // Set up stats update interval
    const updateStats = () => {
      ;(async () => {
        var stats = await getSession()!._getStats()
        setStats({
          backend: 'test',
          objectCount: stats.objects.count,
          refObjectCount: stats.refObjects.count,
        })
      })()
    }

    const interval = setInterval(updateStats, 1000)
    updateStats()
    return () => clearInterval(interval)
  }, [])

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900/60 text-white p-4">
        <div className="animate-pulse">Loading memory stats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900/60 text-white p-6">
      <div className="max-w-md mx-auto bg-gray-800/80 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">
          WebSpatial Usage Stats
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 transition-colors">
            <span className="text-gray-300">Object count:</span>
            <span className="font-mono text-blue-300">{stats.objectCount}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 transition-colors">
            <span className="text-gray-300">Ref count:</span>
            <span className="font-mono text-blue-300">
              {stats.refObjectCount}
            </span>
          </div>
          <div className="mt-6">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${(stats.objectCount / stats.refObjectCount) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 text-right mt-1">
              {((stats.objectCount / stats.refObjectCount) * 100).toFixed(1)}%
              ObjectCount/RefCount
            </div>
          </div>
        </div>
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

// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
