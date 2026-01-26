import React, { useState } from 'react'
import {
  RealityWithWRM,
  ModelAssetWithWRM,
  UnlitMaterialWithWRM,
  ModelEntity,
  SceneGraph,
} from '../reality'
import { WRMDevPanel, useWRMStats, useWRMResources } from './'

const WRMDebugDemo: React.FC = () => {
  const [showModel, setShowModel] = useState(false)
  const [preloadEnabled, setPreloadEnabled] = useState(false)
  const stats = useWRMStats()
  const loadingResources = useWRMResources(r => r.state === 'LOADING')

  return (
    <div className="p-8 space-y-4">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">WRM Stage 0 & 1 Demo</h2>

        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowModel(!showModel)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {showModel ? 'Hide Model' : 'Show Model'}
            </button>

            <button
              onClick={() => setPreloadEnabled(!preloadEnabled)}
              className={`px-4 py-2 rounded ${
                preloadEnabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Preload: {preloadEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="bg-gray-100 rounded p-4">
            <h3 className="font-semibold mb-2">Live Stats:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Total Resources: {stats.totalResources}</div>
              <div>Loading: {stats.activeLoadRequests}</div>
              <div>
                Memory: {(stats.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB
              </div>
              <div>
                Cache Hit Rate: {(stats.cacheHitRate * 100).toFixed(0)}%
              </div>
            </div>

            {loadingResources.length > 0 && (
              <div className="mt-2">
                <strong>Currently Loading:</strong>
                <ul className="list-disc list-inside">
                  {loadingResources.map(r => (
                    <li key={r.id}>
                      {r.id} ({r.type})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <RealityWithWRM className="w-full h-96 border rounded-lg">
        <ModelAssetWithWRM
          id="demoModel"
          src="/models/vehicle-speedster.usdz"
          preload={preloadEnabled}
          onLoad={() => console.log('Model loaded successfully')}
          onError={error => console.error('Model load error:', error)}
        />

        <UnlitMaterialWithWRM
          id="demoMaterial"
          color="#ff6b6b"
          textureUrl="/textures/metal.png"
        />

        {showModel && (
          <SceneGraph>
            <ModelEntity
              model="demoModel"
              materials={['demoMaterial']}
              position={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
            />
          </SceneGraph>
        )}
      </RealityWithWRM>
    </div>
  )
}

export default WRMDebugDemo
