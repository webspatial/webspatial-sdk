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

const btnCls =
  'select-none px-4 py-1 text-sm font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

/**
 * Test page for entity-tree-ops: exercises recreateKey, dynamic
 * GeometryEntity (removeComponent + new geometry + addComponent), ModelEntity
 * materials (setMaterials), and UnlitMaterial dynamic props (updateProperties).
 */
export default function RealityEntityTreeOps() {
  const [entityKey, setEntityKey] = useState(0)

  const [boxWidth, setBoxWidth] = useState(0.15)
  const [boxHeight, setBoxHeight] = useState(0.15)
  const [boxDepth, setBoxDepth] = useState(0.1)
  const [boxMaterials, setBoxMaterials] = useState<string[]>([
    'matRed',
    'matGreen',
    'matBlue',
    'matBlack',
    'matOrange',
    'matPurple',
  ])

  const [modelId, setModelId] = useState<'model' | 'modelAlt'>('model')
  const [modelMaterials, setModelMaterials] = useState<string[] | undefined>([
    'matRed',
  ])
  const [modelMaterialIndex, setModelMaterialIndex] = useState(0)
  const modelMaterialOptions = [
    ['matRed'],
    ['matGreen'],
    ['matBlue'],
    undefined,
  ]

  const [dynamicColor, setDynamicColor] = useState('#ff00ff')
  const [dynamicOpacity, setDynamicOpacity] = useState(0.8)

  const cycleModelMaterials = () => {
    const nextIndex = (modelMaterialIndex + 1) % modelMaterialOptions.length
    setModelMaterialIndex(nextIndex)
    setModelMaterials(modelMaterialOptions[nextIndex])
  }

  const cycleBoxMaterials = () => {
    setBoxMaterials(prev =>
      prev[0] === 'matRed'
        ? [
            'matGreen',
            'matBlue',
            'matBlack',
            'matOrange',
            'matPurple',
            'matRed',
          ]
        : ['matRed', 'matGreen', 'matBlue', 'matBlack', 'mat5', 'mat6'],
    )
  }

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Entity Tree Ops Test</h1>
      <p className="text-gray-400 text-sm mb-6">
        Tests: recreateKey, GeometryEntity dynamic geometry/materials,
        ModelEntity materials, UnlitMaterial updateProperties.
      </p>

      <div className="flex flex-wrap gap-2 my-6 bg-[#1A1A1A] p-4 rounded-xl border border-gray-800">
        <button className={btnCls} onClick={() => setEntityKey(k => k + 1)}>
          Recreate keyed entity (key={entityKey})
        </button>
        <button
          className={btnCls}
          onClick={() => setBoxWidth(w => (w === 0.15 ? 0.25 : 0.15))}
        >
          Toggle box width
        </button>
        <button
          className={btnCls}
          onClick={() => setBoxHeight(h => (h === 0.15 ? 0.25 : 0.15))}
        >
          Toggle box height
        </button>
        <button
          className={btnCls}
          onClick={() => setBoxDepth(d => (d === 0.1 ? 0.2 : 0.1))}
        >
          Toggle box depth
        </button>
        <button className={btnCls} onClick={cycleBoxMaterials}>
          Cycle box materials
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setModelId(m => (m === 'model' ? 'modelAlt' : 'model'))
          }
        >
          Toggle model (recreateKey)
        </button>
        <button className={btnCls} onClick={cycleModelMaterials}>
          Cycle model materials
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setDynamicColor(c => (c === '#ff00ff' ? '#00ff88' : '#ff00ff'))
          }
        >
          Toggle dynamic material color
        </button>
        <button
          className={btnCls}
          onClick={() => setDynamicOpacity(o => (o === 0.8 ? 0.4 : 0.8))}
        >
          Toggle dynamic opacity
        </button>
      </div>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
        <Reality
          style={{
            width: '100%',
            height: '600px',
            '--xr-depth': 150,
            '--xr-back': 100,
          }}
        >
          <UnlitMaterial
            id="matRed"
            color="#ff0000"
            transparent
            opacity={0.7}
          />
          <UnlitMaterial
            id="matGreen"
            color="#00ff00"
            transparent
            opacity={0.7}
          />
          <UnlitMaterial
            id="matBlue"
            color="#0000ff"
            transparent
            opacity={0.7}
          />
          <UnlitMaterial
            id="matBlack"
            color="#000000"
            transparent
            opacity={0.7}
          />
          <UnlitMaterial
            id="matOrange"
            color="#ff8800"
            transparent
            opacity={0.7}
          />
          <UnlitMaterial
            id="matPurple"
            color="#9900ff"
            transparent
            opacity={0.7}
          />
          <UnlitMaterial id="mat5" color="#eb45b7" transparent opacity={0.7} />
          <UnlitMaterial id="mat6" color="#0e4c20" transparent opacity={0.7} />
          <UnlitMaterial
            id="matDynamic"
            color={dynamicColor}
            transparent
            opacity={dynamicOpacity}
          />

          <ModelAsset id="model" src="/assets/vehicle-speedster.usdz">
            <source
              src="/assets/vehicle-speedster.usdz"
              type="model/vnd.usdz+zip"
            />
          </ModelAsset>
          <ModelAsset id="modelAlt" src="/assets/vehicle-speedster.usdz">
            <source
              src="/assets/vehicle-speedster.usdz"
              type="model/vnd.usdz+zip"
            />
          </ModelAsset>

          <SceneGraph>
            <Entity
              position={{ x: 0, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
            >
              <BoxEntity
                key={entityKey}
                id="keyedBox"
                name="keyedBox"
                width={0.12}
                height={0.12}
                depth={0.08}
                materials={['matPurple']}
                position={{ x: -0.25, y: 0.12, z: 0 }}
              />
              <BoxEntity
                id="dynamicBox"
                name="dynamicBox"
                width={boxWidth}
                height={boxHeight}
                depth={boxDepth}
                cornerRadius={0.02}
                splitFaces
                materials={boxMaterials}
                position={{ x: 0, y: 0.12, z: 0 }}
              />
              <ModelEntity
                id="modelEnt"
                name="modelEnt"
                model={modelId}
                materials={modelMaterials}
                position={{ x: 0.25, y: 0.12, z: 0 }}
                scale={{ x: 0.15, y: 0.15, z: 0.15 }}
              />
              <BoxEntity
                id="dynamicMatBox"
                name="dynamicMatBox"
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
    </div>
  )
}
