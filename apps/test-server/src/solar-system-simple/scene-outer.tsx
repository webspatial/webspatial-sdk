import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Reality,
  SceneGraph,
  SphereEntity,
  UnlitMaterial,
  enableDebugTool,
} from '@webspatial/react-sdk'

enableDebugTool()

function OuterPlanetsScene() {
  const outer = [
    { name: 'Jupiter', distance: 0.75, size: 0.1, color: 'matJupiter' },
    { name: 'Saturn', distance: 0.9, size: 0.09, color: 'matSaturn' },
    { name: 'Uranus', distance: 1.05, size: 0.07, color: 'matUranus' },
    { name: 'Neptune', distance: 1.2, size: 0.07, color: 'matNeptune' },
  ]

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Reality
        style={{
          width: '100%',
          height: '100%',
          '--xr-back': 120,
          '--xr-depth': 150,
        }}
      >
        <UnlitMaterial id="matSun" color="#FDB813" />
        <UnlitMaterial id="matJupiter" color="#D8CA9D" />
        <UnlitMaterial id="matSaturn" color="#FAD5A5" />
        <UnlitMaterial id="matUranus" color="#4FD0E3" />
        <UnlitMaterial id="matNeptune" color="#4B70DD" />

        <SceneGraph>
          <SphereEntity
            radius={0.18}
            materials={['matSun']}
            position={{ x: 0, y: 0, z: -1 }}
          />
          {outer.map(p => (
            <SphereEntity
              key={p.name}
              radius={p.size}
              materials={[p.color]}
              position={{ x: p.distance - 0.8, y: 0, z: -1 }}
            />
          ))}
        </SceneGraph>
      </Reality>
    </div>
  )
}

const root = document.getElementById('scene-root')
if (root) {
  ReactDOM.createRoot(root).render(<OuterPlanetsScene />)
}
