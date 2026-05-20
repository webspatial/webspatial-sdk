import {
  Entity,
  ModelAsset,
  ModelEntity,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import React, { useState } from 'react'

// Repro page for https://github.com/webspatial/webspatial-sdk/issues/1221
//
// The expected behavior is that each ModelEntity below creates an independent
// scene instance from the same ModelAsset. On the buggy implementation, the
// native RealityKit Entity is shared, so only one model may appear and removing
// one instance can remove the shared model from the scene.
export default function RealitySharedModelAssetRepro() {
  const [showMiddleModel, setShowMiddleModel] = useState(true)
  const [moveLeftModel, setMoveLeftModel] = useState(false)
  const [rotateRightModel, setRotateRightModel] = useState(false)
  const [overrideLeftMaterial, setOverrideLeftMaterial] = useState(false)

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    margin: '0 6px 6px 0',
    border: '1.5px solid #aaa',
    borderRadius: 8,
    background: '#f6f6f6',
    cursor: 'pointer',
    fontSize: 15,
    fontFamily: 'inherit',
    transition: 'background 0.15s',
    outline: 'none',
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl mb-3">Issue 1221: Shared ModelAsset Repro</h2>
      <p className="mb-3 text-gray-300">
        This page renders three ModelEntity instances that all reference the
        same ModelAsset id. They should appear as three independent models with
        independent transforms, materials, and lifecycles.
      </p>
      <div style={{ marginBottom: 16 }}>
        <button
          style={btnStyle}
          onClick={() => setShowMiddleModel(prev => !prev)}
        >
          Toggle middle model ({showMiddleModel ? 'shown' : 'hidden'})
        </button>
        <button
          style={btnStyle}
          onClick={() => setMoveLeftModel(prev => !prev)}
        >
          Move left model ({moveLeftModel ? 'raised' : 'normal'})
        </button>
        <button
          style={btnStyle}
          onClick={() => setRotateRightModel(prev => !prev)}
        >
          Rotate right model ({rotateRightModel ? 'rotated' : 'normal'})
        </button>
        <button
          style={btnStyle}
          onClick={() => setOverrideLeftMaterial(prev => !prev)}
        >
          Toggle left material override ({overrideLeftMaterial ? 'on' : 'off'})
        </button>
      </div>
      <ul className="mb-4 list-disc pl-5 text-gray-300">
        <li>Expected: left, middle, and right models are visible at once.</li>
        <li>Expected: toggling the middle model does not remove the others.</li>
        <li>Expected: left material/position changes do not affect the others.</li>
      </ul>

      <Reality
        style={{
          width: 800,
          height: 500,
          '--xr-depth': 120,
          '--xr-back': 200,
        }}
      >
        <UnlitMaterial id="sharedReproYellow" color="#ffd400" />
        <ModelAsset id="sharedVehicle" src="/assets/vehicle-speedster.usdz" />
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <ModelEntity
              id="sharedVehicleLeft"
              model="sharedVehicle"
              materials={overrideLeftMaterial ? ['sharedReproYellow'] : undefined}
              position={{ x: -0.28, y: moveLeftModel ? 0.12 : 0, z: 0 }}
              rotation={{ x: 0, y: -0.35, z: 0 }}
              scale={{ x: 0.14, y: 0.14, z: 0.14 }}
            />
            {showMiddleModel && (
              <ModelEntity
                id="sharedVehicleMiddle"
                model="sharedVehicle"
                position={{ x: 0, y: 0, z: 0 }}
                rotation={{ x: 0, y: 0, z: 0 }}
                scale={{ x: 0.14, y: 0.14, z: 0.14 }}
              />
            )}
            <ModelEntity
              id="sharedVehicleRight"
              model="sharedVehicle"
              position={{ x: 0.28, y: 0, z: 0 }}
              rotation={{ x: 0, y: rotateRightModel ? 0.9 : 0.35, z: 0 }}
              scale={{ x: 0.14, y: 0.14, z: 0.14 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </div>
  )
}
