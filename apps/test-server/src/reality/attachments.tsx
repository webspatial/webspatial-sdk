import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Reality,
  SceneGraph,
  BoxEntity,
  SphereEntity,
  CylinderEntity,
  ConeEntity,
  PlaneEntity,
  UnlitMaterial,
  Attachment,
} from '@webspatial/react-sdk'

function App() {
  const [tick, setTick] = React.useState(0)
  const [animating, setAnimating] = React.useState(false)
  const [t, setT] = React.useState(0)
  const rafRef = React.useRef<number | null>(null)
    const [likes, setLikes] = React.useState(0)
      const [count, setCount] = React.useState(0);


  const add = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  })

  React.useEffect(() => {
    if (!animating) return
    const step = () => {
      setT(prev => prev + 0.016)
      rafRef.current = requestAnimationFrame(step)
    }
    step()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [animating])

  const shift = {
    x: 0.06 * Math.sin(t * 0.6),
    y: 0.04 * Math.sin(t * 0.8),
    z: 0.05 * Math.cos(t * 0.5),
  }
  const rotA = { x: 0.1 * Math.sin(t * 0.7), y: 0.2 * Math.cos(t * 0.5), z: 0.15 * Math.sin(t * 0.9) }
  const rotB = { x: 0.05 * Math.cos(t * 0.6), y: 0.18 * Math.sin(t * 0.7), z: 0.12 * Math.cos(t * 0.4) }
  const rotC = { x: 0.08 * Math.sin(t * 0.5), y: 0.08 * Math.cos(t * 0.6), z: 0.08 * Math.sin(t * 0.7) }

  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 18px',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  }

  const chip: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
  }

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
        ['--xr-background-material' as any]: 'translucent',
      }}
    >
     
      <button
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 1000,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #ddd',
          background: '#fff',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          cursor: 'pointer',
        }}
        onClick={() => setAnimating(a => !a)}
      >
        {animating ? 'Stop Animation' : 'Animate Entities'}
      </button>
      <Reality
        style={{
          width: '100vw',
          height: '100vh',
        }}
      >
         <div
      enable-xr
      style={{
        backgroundColor: 'lightblue',
        padding: '20px',
        borderRadius: '10px',
        border: '2px solid blue',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        // Spatial properties
        '--xr-back': 50, // Pushes the div 50 units back in the spatial environment
        width: '300px',
        height: '200px',
        position: 'absolute', // Allows for explicit positioning if needed
        left: '100px',
        top: '100px',
        color: 'black',
        fontSize: '24px',
      }}
    >
      <p>Count: {count}</p>
      <button
        onClick={() => setCount(prevCount => prevCount + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Increment
      </button>
      <button
        onClick={() => setCount(prevCount => prevCount - 1)}
        style={{
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '5px',
        }}
      >
        Decrement
      </button>
    </div>
        <UnlitMaterial id="matBlue" color="#3388ff" />
        <UnlitMaterial id="matRed" color="#ff5a5f" />
        <UnlitMaterial id="matGreen" color="#35c759" />
        <UnlitMaterial id="matPurple" color="#7d4cff" />
        <UnlitMaterial id="matGray" color="#999999" transparent opacity={0.25} />

        <SceneGraph>
          <PlaneEntity width={0.6} height={0.4} materials={["matGray"]} position={add({ x: 0, y: -0.08, z: -0.02 }, shift)} />

          <BoxEntity
            width={0.1}
            height={0.1}
            depth={0.1}
            cornerRadius={0.02}
            materials={["matBlue"]}
            position={add({ x: 0, y: 0, z: 0 }, shift)}
            rotation={rotA}
          >
            <Attachment anchor={[0.5, 1, 0.5]} offset={[0, 0.12, 0.1]} size={{ width: 220, height: 120 }}>
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div>
          <button onClick={() => setLikes(likes + 1)}>{likes} Like</button>
        </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Robot Walle</div>
                  <div style={{ fontSize: 14, color: '#555' }}>Runtime {tick}s • Top anchor</div>
                </div>
                <div style={{ ...chip, background: '#3388ff' }}>ONLINE</div>
              </div>
            </Attachment>
          </BoxEntity>

          <CylinderEntity
            radius={0.05}
            height={0.16}
            materials={["matRed"]}
            position={add({ x: 0.25, y: 0, z: 0.02 }, shift)}
            rotation={rotB}
          >
            <Attachment anchor={[1, 0.5, 0.5]} offset={[0.08, 0.04, 0]} size={{ width: 200, height: 120 }}>
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Cylinder Pump</div>
                <div style={{ ...chip, background: '#ff5a5f' }}>1.2 bar</div>
              </div>
            </Attachment>
          </CylinderEntity>

          <SphereEntity radius={0.06} materials={["matGreen"]} position={add({ x: -0.25, y: 0.02, z: 0 }, shift)} rotation={rotC}>
            <Attachment anchor={[0.5, 1, 0.5]} offset={[0, 0.1, 0.08]} size={{ width: 200, height: 120 }}>
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Beacon</div>
                <div style={{ ...chip, background: '#35c759' }}>85% battery</div>
              </div>
            </Attachment>
          </SphereEntity>

          <ConeEntity radius={0.05} height={0.14} materials={["matPurple"]} position={add({ x: 0, y: 0.16, z: -0.22 }, shift)} rotation={rotA}>
            <Attachment anchor={[0.5, 1, 0.5]} offset={[0, 0.08, 0.1]} size={{ width: 220, height: 90 }}>
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Sensor Node</div>
                <div style={{ ...chip, background: '#7d4cff' }}>active</div>
              </div>
            </Attachment>
          </ConeEntity>

          <PlaneEntity width={0.2} height={0.14} materials={["matGray"]} position={add({ x: 0, y: -0.01, z: -0.38 }, shift)} rotation={rotB}>
            <Attachment anchor={[0.5, 0.5, 0.5]} offset={[0, 0.08, 0]} size={{ width: 240, height: 100 }}>
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Scene HUD</div>
                  <div style={{ fontSize: 14, color: '#555' }}>Attachments update live • tick {tick}</div>
                </div>
                <div style={{ ...chip, background: '#999' }}>demo</div>
              </div>
            </Attachment>
          </PlaneEntity>
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
