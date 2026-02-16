import { useEffect, useRef, useState } from 'react'
import {
  BoxEntity,
  ModelAsset,
  ModelEntity,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'

interface MaterialInfo {
  id: string
  color: string
}

interface EntityInfo {
  id?: string | number
  position: {
    x: number
    y: number
    z: number
  }
  materials: string[]
  scale?: {
    x: number
    y: number
    z: number
  }
  cornerRadius?: number
}

function DynamicTest() {
  const [boxSize] = useState({
    width: 0,
    height: 0,
    depth: 0,
    cornerRadius: 0,
  })
  const frameRef = useRef<number>(0)
  const carFrameRef = useRef<number>(0)
  const [entityList, setEntityList] = useState<EntityInfo[]>([])
  const entityListRef = useRef<EntityInfo[]>([])
  const [materialList, setMaterialList] = useState<MaterialInfo[]>([])
  const [playCar, setPlayCar] = useState<boolean>(false)
  const playCarRef = useRef<boolean>(false)
  const [boxRot, setBoxRot] = useState({ x: 0, y: 90, z: 0 })
  const [boxPos, setBoxPos] = useState({ x: 0, y: 0, z: 0.4 })

  const requestRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barCount = 20
  const speed = 0.01
  const barWidthRef = useRef<number>(0)
  const barHeightRef = useRef<number>(0)
  const targetHeightRef = useRef<number>(0)

  const [isLowHeight, setIsLowHeight] = useState<boolean>(false)
  const lowHeightRef = useRef<boolean>(false)
  const scale = 1300

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }
    const canvas = canvasRef.current
    canvas.width = canvas.clientWidth * window.devicePixelRatio
    canvas.height = canvas.clientHeight * window.devicePixelRatio
    barWidthRef.current = canvas.width / barCount
    barHeightRef.current = canvas.height / 2
    targetHeightRef.current = canvas.height / 2
    boxSize.width = barWidthRef.current / scale / window.devicePixelRatio
    boxSize.height = boxSize.width
    boxSize.depth = boxSize.width
    let matList: MaterialInfo[] = []
    let eList: EntityInfo[] = []
    for (let i = 0; i < barCount; i++) {
      let materialInfo = {
        id: `material_${i}`,
        color: hslToHex((i * 360) / barCount, 70, 50),
      }
      matList.push(materialInfo)
      setMaterialList(matList)

      let entityInfo = {
        id: `entity_${i}`,
        position: {
          x:
            (i * barWidthRef.current - canvas.width / 2 + barWidthRef.current) /
            scale /
            window.devicePixelRatio,
          y: 0,
          z: 0.2,
        },
        materials: [materialInfo.id],
        cornerRadius: boxSize.width / 3,
      }
      eList.push(entityInfo)
      setEntityList(eList)
    }
  }, [canvasRef.current])

  useEffect(() => {
    entityListRef.current = entityList
  }, [entityList])

  useEffect(() => {
    playCarRef.current = playCar
  }, [playCar])

  useEffect(() => {
    lowHeightRef.current = isLowHeight
    console.log('isLowHeight', isLowHeight)
  }, [isLowHeight])

  useEffect(() => {
    function updateGame() {
      requestRef.current = requestAnimationFrame(updateGame)
      if (!canvasRef.current) {
        return
      }
      let ctx = canvasRef.current.getContext('2d')
      if (!ctx || !entityListRef.current.length) {
        return
      }

      frameRef.current++
      const canvas = canvasRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (lowHeightRef.current) {
        targetHeightRef.current = canvas.height / 4
      } else {
        targetHeightRef.current = canvas.height
      }

      barHeightRef.current +=
        (targetHeightRef.current - barHeightRef.current) * 0.03
      const maxHeight = barHeightRef.current
      const barWidth = barWidthRef.current

      const updatedEntities = [...entityListRef.current]
      for (let i = 0; i < barCount; i++) {
        const waveHeight =
          Math.abs(
            Math.sin((i * Math.PI) / barCount + frameRef.current * speed),
          ) * maxHeight
        const x = i * barWidth
        const y = canvas.height - waveHeight

        const hue = ((i * 360) / barCount) % 360
        ctx.fillStyle = hslToHex(hue, 70, 50)
        ctx.fillRect(x, y, barWidth - 2, waveHeight)
        updatedEntities[i] = {
          ...updatedEntities[i],
          position: {
            ...updatedEntities[i].position,
            y:
              (waveHeight - canvas.height / 2) /
              scale /
              window.devicePixelRatio,
          },
        }
      }
      if (playCarRef.current) {
        carFrameRef.current++
      }
      let preCarX = Math.sin((carFrameRef.current - 1) * speed) * 0.4
      let carX = Math.sin(carFrameRef.current * speed) * 0.4
      let carY =
        Math.abs(
          Math.sin(((carX + 0.4) / 0.8) * Math.PI + frameRef.current * speed),
        ) * maxHeight
      const angle = carX - preCarX > 0 ? 90 : -90
      setBoxRot({ x: 0, y: -angle, z: 0 })
      setBoxPos({
        x: carX,
        y: (carY - canvas.height / 2) / scale / window.devicePixelRatio + 0.05,
        z: 0.2,
      })

      setEntityList(updatedEntities)
    }
    requestRef.current = requestAnimationFrame(updateGame)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
    }
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          fontSize: '56px',
          fontWeight: 'bold',
          color: 'black',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: 'black',
              marginBottom: '20px',
            }}
          >
            Welcome to WebSpatial
          </div>
          <button
            onClick={() => setPlayCar(!playCar)}
            style={{
              padding: '24px 48px',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#ffffff',
              backgroundColor: playCar ? '#ff4d4f' : '#52c41a',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              margin: '20px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            {playCar ? 'Pause Car' : 'Play Car'}
          </button>
        </div>
        <div
          style={{
            pointerEvents: 'none',
            width: '100%',
            height: '500px',
            position: 'absolute',
            bottom: 0,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          ></canvas>
        </div>
        <Reality
          style={{
            width: '100%',
            height: '500px',
            position: 'absolute',
            bottom: 0,
            zIndex: 1,
          }}
        >
          {materialList.map(material => (
            <UnlitMaterial
              key={material.id}
              id={material.id}
              color={material.color}
            />
          ))}
          <UnlitMaterial id="high" color="#ff4d4f" />
          <UnlitMaterial id="low" color="#52c41a" />
          <ModelAsset
            id="model"
            src="/assets/vehicle-speedster.usdz"
            onLoad={() => {
              console.log('model load')
            }}
            onError={e => {
              console.log('model error', e)
            }}
          />
          <SceneGraph>
            <BoxEntity
              width={boxSize.width * 2}
              height={boxSize.height}
              depth={boxSize.depth}
              position={{ x: -0.3, y: 0.2, z: 0.4 }}
              materials={['high']}
              cornerRadius={boxSize.cornerRadius}
              onSpatialTap={() => {
                console.log('click high box')
                setIsLowHeight(false)
              }}
            />
            <BoxEntity
              width={boxSize.width * 2}
              height={boxSize.height}
              depth={boxSize.depth}
              position={{ x: -0.3, y: -0.05, z: 0.4 }}
              materials={['low']}
              cornerRadius={boxSize.cornerRadius}
              onSpatialTap={() => {
                console.log('click low box')
                setIsLowHeight(true)
              }}
            />
            {entityList.map(entity => (
              <BoxEntity
                key={entity.id}
                width={boxSize.width}
                height={boxSize.height}
                depth={boxSize.depth}
                position={entity.position}
                materials={entity.materials}
                cornerRadius={entity.cornerRadius}
              />
            ))}
            <ModelEntity
              id="modelEnt"
              name="modelEntName"
              model="model"
              position={boxPos}
              rotation={boxRot}
              scale={{ x: 0.14, y: 0.14, z: 0.1 }}
            />
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}

const hslToHex = (h: number, s: number, l: number) => {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export default DynamicTest
