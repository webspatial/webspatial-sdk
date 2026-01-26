import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  RealityWithWRM,
  ModelAssetWithWRM,
  UnlitMaterialWithWRM,
  WRMDevPanel,
  WRMDevToggle,
  useWRMStats,
  useWRMResources,
} from '@webspatial/react-sdk'
import { SceneGraph, ModelEntity } from '@webspatial/react-sdk'

function Controls() {
  const stats = useWRMStats()
  const resources = useWRMResources()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-600">
          Resources: {stats.totalResources} · Loads: {stats.activeLoadRequests}{' '}
          · Mem: {(stats.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB
        </span>
        <WRMDevToggle
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          stats={stats}
        />
      </div>
      <WRMDevPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        stats={stats}
        resources={resources}
      />
    </>
  )
}

function App() {
  const [showModel, setShowModel] = useState(false)
  const [preload, setPreload] = useState(true)

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">WRM Demo (Real)</h1>
      <p className="text-sm text-gray-600 mb-4">
        Stage 0 & 1: Declarative resource lifecycle with live instrumentation
      </p>

      <div className="flex gap-2 mb-4">
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setShowModel(v => !v)}
        >
          {showModel ? 'Hide Model' : 'Show Model'}
        </button>
        <button
          className={`px-3 py-1 rounded ${preload ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setPreload(v => !v)}
        >
          Preload: {preload ? 'ON' : 'OFF'}
        </button>
      </div>

      <RealityWithWRM
        className="w-[600px] h-[400px] border rounded bg-white"
        style={{ '--xr-depth': 100, '--xr-back': 150 } as React.CSSProperties}
      >
        <Controls />

        <ModelAssetWithWRM
          id="wrm-demo-model"
          src="/public/assets/vehicle-speedster.usdz"
          preload={preload}
          onLoad={() => console.log('WRM model ready')}
          onError={(e: any) => console.error('WRM model error', e)}
        />

        <UnlitMaterialWithWRM id="wrm-demo-mat" color="#ff6b6b" />

        {showModel && (
          <SceneGraph>
            <ModelEntity
              id="wrm-demo-entity"
              model="wrm-demo-model"
              scale={{ x: 0.25, y: 0.25, z: 0.25 }}
            />
          </SceneGraph>
        )}
      </RealityWithWRM>
    </div>
  )
}

var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
