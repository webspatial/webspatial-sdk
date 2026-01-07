import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Reality,
  SceneGraph,
  BoxEntity,
  UnlitMaterial,
  Attachment,
} from '@webspatial/react-sdk'

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        // VisionOS volume-style hint
        ['--xr-background-material' as any]: 'translucent',
      }}
    >
      <Reality
        style={{
          width: '100vw',
          height: '100vh',
        }}
      >
        <UnlitMaterial id="matBlue" color="#3388ff" />
        <SceneGraph>
          <BoxEntity
            width={0.2}
            height={0.2}
            depth={0.2}
            cornerRadius={0.02}
            materials={['matBlue']}
            position={{ x: 0, y: 0, z: 0 }}
          >
            <Attachment anchor={[0.5,1,0.5]} offset={[0,0.1,0]}><div className="label">Robot Name</div></Attachment>
          </BoxEntity>
        </SceneGraph>
      </Reality>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
