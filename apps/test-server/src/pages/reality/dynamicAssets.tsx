import React, { useState } from 'react'
import {
  Reality,
  SceneGraph,
  Entity,
  BoxEntity,
  ModelEntity,
  ModelAsset,
  UnlitMaterial,
} from '@webspatial/react-sdk'

// Simple test page for testing dynamic assets:
// - recreateKey (removes/recreates BoxEntity)
// - BoxEntity dynamic geometry and materials
// - ModelEntity materials (setMaterials)
// - UnlitMaterial live property update
export default function RealityDynamicAssets() {
  // Re-keying an entity forces it to be unmounted/mounted in the scene
  const [entityKey, setEntityKey] = useState(0)

  // BoxEntity geometry and materials test
  const [boxWidth, setBoxWidth] = useState(0.15)
  const [boxHeight, setBoxHeight] = useState(0.15)
  const [boxDepth, setBoxDepth] = useState(0.1)
  const [boxMaterials, setBoxMaterials] = useState<string[]>([
    'matRed',
    'matGreen',
    'matBlue',
  ])

  // ModelEntity materials test
  const [modelId, setModelId] = useState<'model' | 'modelAlt'>('model')
  const [modelMaterials, setModelMaterials] = useState<string[] | undefined>([
    'matRed',
  ])
  const [modelMaterialSet, setModelMaterialSet] = useState(0)
  const modelMaterialOptions: (string[] | undefined)[] = [
    ['matRed'],
    ['matGreen'],
    ['matBlue'],
    ['matDynamic'],
    undefined,
  ]

  // UnlitMaterial dynamic property test
  const [dynamicColor, setDynamicColor] = useState('#ff00ff')
  const [dynamicOpacity, setDynamicOpacity] = useState(0.8)

  // Handlers for cycling/material toggling
  function handleRecreateKey() {
    setEntityKey(k => k + 1)
  }
  function handleBoxWidth() {
    setBoxWidth(w => (w === 0.15 ? 0.25 : 0.15))
  }
  function handleBoxHeight() {
    setBoxHeight(h => (h === 0.15 ? 0.25 : 0.15))
  }
  function handleBoxDepth() {
    setBoxDepth(d => (d === 0.1 ? 0.2 : 0.1))
  }
  function handleBoxMaterials() {
    setBoxMaterials(prev =>
      prev[0] === 'matRed'
        ? ['matGreen', 'matBlue', 'matRed']
        : ['matRed', 'matGreen', 'matBlue'],
    )
  }
  function handleToggleModelId() {
    setModelId(m => (m === 'model' ? 'modelAlt' : 'model'))
  }
  function handleModelMaterials() {
    setModelMaterialSet(i => {
      const next = (i + 1) % modelMaterialOptions.length
      setModelMaterials(modelMaterialOptions[next])
      return next
    })
  }
  function handleDynamicColor() {
    setDynamicColor(c => (c === '#ff00ff' ? '#00ff88' : '#ff00ff'))
  }
  function handleDynamicOpacity() {
    setDynamicOpacity(o => (o === 0.8 ? 0.4 : 0.8))
  }

  // Minimal button inline style: larger clickable, subtle border, pointer
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
  // on hover, apply very light gray (not via CSS, keep JS only), so no further handling

  return (
    <div>
      <h2>Dynamic Assets Test</h2>
      <div style={{ marginBottom: 16 }}>
        <button style={btnStyle} onClick={handleRecreateKey}>
          Recreate keyed box (key={entityKey})
        </button>
        <button style={btnStyle} onClick={handleBoxWidth}>
          Toggle box width ({boxWidth})
        </button>
        <button style={btnStyle} onClick={handleBoxHeight}>
          Toggle box height ({boxHeight})
        </button>
        <button style={btnStyle} onClick={handleBoxDepth}>
          Toggle box depth ({boxDepth})
        </button>
        <button style={btnStyle} onClick={handleBoxMaterials}>
          Cycle box materials
        </button>
        <button style={btnStyle} onClick={handleToggleModelId}>
          Toggle model (id={modelId})
        </button>
        <button style={btnStyle} onClick={handleModelMaterials}>
          Cycle model materials
        </button>
        <button style={btnStyle} onClick={handleDynamicColor}>
          Toggle dynamic material color
        </button>
        <button style={btnStyle} onClick={handleDynamicOpacity}>
          Toggle dynamic opacity ({dynamicOpacity})
        </button>
      </div>
      <Reality style={{ width: 640, height: 400 }}>
        {/* Material definitions for box/model tests */}
        <UnlitMaterial id="matRed" color="#ff0000" transparent opacity={0.7} />
        <UnlitMaterial
          id="matGreen"
          color="#00ff00"
          transparent
          opacity={0.7}
        />
        <UnlitMaterial id="matBlue" color="#0000ff" transparent opacity={0.7} />
        <UnlitMaterial
          id="matDynamic"
          color={dynamicColor}
          transparent
          opacity={dynamicOpacity}
        />
        {/* These model asset ids must match what's used in ModelEntity */}
        <ModelAsset id="model" src="/assets/vehicle-speedster.usdz" />
        <ModelAsset id="modelAlt" src="/assets/vehicle-speedster.usdz" />
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <BoxEntity
              key={entityKey}
              id="keyedBox"
              width={0.12}
              height={0.12}
              depth={0.08}
              materials={['matRed']}
              position={{ x: -0.25, y: 0.12, z: 0 }}
            />
            <BoxEntity
              id="dynamicBox"
              width={boxWidth}
              height={boxHeight}
              depth={boxDepth}
              materials={boxMaterials}
              position={{ x: 0, y: 0.12, z: 0 }}
            />
            <ModelEntity
              id="modelEnt"
              model={modelId}
              materials={modelMaterials}
              position={{ x: 0.25, y: 0.12, z: 0 }}
              scale={{ x: 0.15, y: 0.15, z: 0.15 }}
            />
            <BoxEntity
              id="dynamicMatBox"
              width={0.1}
              height={0.1}
              depth={0.06}
              materials={['matDynamic']}
              position={{ x: 0, y: -0.12, z: 0 }}
            />
          </Entity>
        </SceneGraph>
      </Reality>
    </div>
  )
}
