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
  const [boxBlue, setBoxBlue] = React.useState(true)
  const [cylRed, setCylRed] = React.useState(true)
  const [sphereGreen, setSphereGreen] = React.useState(true)
  const [conePurple, setConePurple] = React.useState(true)

  const [posBox, setPosBox] = React.useState({ x: 0, y: 0, z: 0 })
  const [posCyl, setPosCyl] = React.useState({ x: 0.25, y: 0, z: 0.02 })
  const [posSphere, setPosSphere] = React.useState({ x: -0.25, y: 0.02, z: 0 })
  const [posCone, setPosCone] = React.useState({ x: 0, y: 0.16, z: -0.22 })
  const startBoxRef = React.useRef({ x: 0, y: 0, z: 0 })
  const startCylRef = React.useRef({ x: 0.25, y: 0, z: 0.02 })
  const startSphereRef = React.useRef({ x: -0.25, y: 0.02, z: 0 })
  const startConeRef = React.useRef({ x: 0, y: 0.16, z: -0.22 })

  const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v))
  const TRANSLATION_SCALE = 0.001

  const onDragStartBox = () => {
    startBoxRef.current = posBox
  }
  const onDragBox = (e: any) => {
    const t = e.detail.translation3D
    const nx = clamp(startBoxRef.current.x + t.x * TRANSLATION_SCALE)
    const ny = clamp(startBoxRef.current.y - t.y * TRANSLATION_SCALE)
    const nz = clamp(startBoxRef.current.z + t.z * TRANSLATION_SCALE)
    setPosBox({ x: nx, y: ny, z: nz })
  }
  const onDragStartCyl = () => {
    startCylRef.current = posCyl
  }
  const onDragCyl = (e: any) => {
    const t = e.detail.translation3D
    const nx = clamp(startCylRef.current.x + t.x * TRANSLATION_SCALE)
    const ny = clamp(startCylRef.current.y - t.y * TRANSLATION_SCALE)
    const nz = clamp(startCylRef.current.z + t.z * TRANSLATION_SCALE)
    setPosCyl({ x: nx, y: ny, z: nz })
  }
  const onDragStartSphere = () => {
    startSphereRef.current = posSphere
  }
  const onDragSphere = (e: any) => {
    const t = e.detail.translation3D
    const nx = clamp(startSphereRef.current.x + t.x * TRANSLATION_SCALE)
    const ny = clamp(startSphereRef.current.y - t.y * TRANSLATION_SCALE)
    const nz = clamp(startSphereRef.current.z + t.z * TRANSLATION_SCALE)
    setPosSphere({ x: nx, y: ny, z: nz })
  }
  const onDragStartCone = () => {
    startConeRef.current = posCone
  }
  const onDragCone = (e: any) => {
    const t = e.detail.translation3D
    const nx = clamp(startConeRef.current.x + t.x * TRANSLATION_SCALE)
    const ny = clamp(startConeRef.current.y - t.y * TRANSLATION_SCALE)
    const nz = clamp(startConeRef.current.z + t.z * TRANSLATION_SCALE)
    setPosCone({ x: nx, y: ny, z: nz })
  }

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

  const rotA = {
    x: 15 * Math.sin(t * 0.7),
    y: 25 * Math.cos(t * 0.5),
    z: 20 * Math.sin(t * 0.9),
  }
  const rotB = {
    x: 10 * Math.cos(t * 0.6),
    y: 22 * Math.sin(t * 0.7),
    z: 18 * Math.cos(t * 0.4),
  }
  const rotC = {
    x: 12 * Math.sin(t * 0.5),
    y: 12 * Math.cos(t * 0.6),
    z: 12 * Math.sin(t * 0.7),
  }
  const sA = 1 + 0.25 * Math.sin(t * 1.2)
  const sB = 1 + 0.2 * Math.cos(t * 1.0)
  const sC = 1 + 0.18 * Math.sin(t * 0.9)
  const sD = 1 + 0.22 * Math.cos(t * 1.1)
  const moveA = animating
    ? { x: 0.03 * Math.sin(t * 0.6), y: 0.02 * Math.cos(t * 0.7), z: 0 }
    : { x: 0, y: 0, z: 0 }
  const moveB = animating
    ? { x: 0.02 * Math.cos(t * 0.8), y: 0.02 * Math.sin(t * 0.6), z: 0 }
    : { x: 0, y: 0, z: 0 }
  const moveC = animating
    ? { x: 0.025 * Math.sin(t * 0.7), y: 0.015 * Math.cos(t * 0.5), z: 0 }
    : { x: 0, y: 0, z: 0 }
  const moveD = animating
    ? { x: 0.02 * Math.sin(t * 0.5), y: 0.02 * Math.cos(t * 0.6), z: 0 }
    : { x: 0, y: 0, z: 0 }
  const add3 = (
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number },
  ) => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  })

  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
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

  const offA: [number, number, number] = [0, 0.02, 0.03]
  const offB: [number, number, number] = [0.03, 0, 0.02]
  const offC: [number, number, number] = [0, 0.02, 0.03]
  const offD: [number, number, number] = [0, 0.02, 0.03]

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
        <UnlitMaterial id="matBlue" color="#3388ff" />
        <UnlitMaterial id="matRed" color="#ff5a5f" />
        <UnlitMaterial id="matGreen" color="#35c759" />
        <UnlitMaterial id="matPurple" color="#7d4cff" />
        <UnlitMaterial
          id="matGray"
          color="#999999"
          transparent
          opacity={0.25}
        />

        <SceneGraph>
          <BoxEntity
            key={`box-${boxBlue ? 'blue' : 'purple'}`}
            width={0.1}
            height={0.1}
            depth={0.1}
            cornerRadius={0.02}
            materials={[boxBlue ? 'matBlue' : 'matPurple']}
            position={add3(posBox, moveA)}
            rotation={rotA}
            scale={{ x: sA, y: sA, z: sA }}
            onSpatialDragStart={onDragStartBox}
            onSpatialDrag={onDragBox}
          >
            <Attachment
              anchor={[0.5, 1, 0.5]}
              offset={offA}
              size={{ width: 280, height: 120 }}
            >
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                    Robot Walle
                  </div>
                  <div style={{ fontSize: 14, color: '#555' }}>
                    Runtime {tick}s • Top anchor
                  </div>
                </div>
                <div style={{ ...chip, background: '#3388ff' }}>ONLINE</div>
                <button
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setBoxBlue(v => !v)}
                >
                  Change Color
                </button>
              </div>
            </Attachment>
          </BoxEntity>

          <CylinderEntity
            key={`cyl-${cylRed ? 'red' : 'green'}`}
            radius={0.05}
            height={0.16}
            materials={[cylRed ? 'matRed' : 'matGreen']}
            position={add3(posCyl, moveB)}
            rotation={rotB}
            scale={{ x: sB, y: sB, z: sB }}
            onSpatialDragStart={onDragStartCyl}
            onSpatialDrag={onDragCyl}
          >
            <Attachment
              anchor={[1, 0.5, 0.5]}
              offset={offB}
              size={{ width: 260, height: 110 }}
            >
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
                  Cylinder Pump
                </div>
                <div style={{ ...chip, background: '#ff5a5f' }}>1.2 bar</div>
                <button
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setCylRed(v => !v)}
                >
                  Change Color
                </button>
              </div>
            </Attachment>
          </CylinderEntity>

          <SphereEntity
            key={`sphere-${sphereGreen ? 'green' : 'red'}`}
            radius={0.06}
            materials={[sphereGreen ? 'matGreen' : 'matRed']}
            position={add3(posSphere, moveC)}
            rotation={rotC}
            scale={{ x: sC, y: sC, z: sC }}
            onSpatialDragStart={onDragStartSphere}
            onSpatialDrag={onDragSphere}
          >
            <Attachment
              anchor={[0.5, 1, 0.5]}
              offset={offC}
              size={{ width: 240, height: 110 }}
            >
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
                  Beacon
                </div>
                <div style={{ ...chip, background: '#35c759' }}>
                  85% battery
                </div>
                <button
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSphereGreen(v => !v)}
                >
                  Change Color
                </button>
              </div>
            </Attachment>
          </SphereEntity>

          <ConeEntity
            key={`cone-${conePurple ? 'purple' : 'blue'}`}
            radius={0.05}
            height={0.14}
            materials={[conePurple ? 'matPurple' : 'matBlue']}
            position={add3(posCone, moveD)}
            rotation={rotA}
            scale={{ x: sD, y: sD, z: sD }}
            onSpatialDragStart={onDragStartCone}
            onSpatialDrag={onDragCone}
          >
            <Attachment
              anchor={[0.5, 1, 0.5]}
              offset={offD}
              size={{ width: 240, height: 110 }}
            >
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
                  Sensor Node
                </div>
                <div style={{ ...chip, background: '#7d4cff' }}>active</div>
                <button
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setConePurple(v => !v)}
                >
                  Change Color
                </button>
              </div>
            </Attachment>
          </ConeEntity>

          <PlaneEntity
            width={0.18}
            height={0.1}
            materials={['matGray']}
            position={{ x: 0, y: -0.01, z: -0.36 }}
            rotation={rotB}
          >
            <Attachment
              anchor={[0.5, 0.5, 0.5]}
              offset={[0, 0.08, 0]}
              size={{ width: 240, height: 100 }}
            >
              <div style={{ ...cardStyle, background: '#fff' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                    Scene HUD
                  </div>
                  <div style={{ fontSize: 14, color: '#555' }}>
                    Attachments update live • tick {tick}
                  </div>
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

export default App
