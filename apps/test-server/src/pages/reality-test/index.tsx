import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BoxEntity,
  Reality,
  SceneGraph,
  SpatialTapEntityEvent,
  UnlitMaterial,
  enableDebugTool,
} from '@webspatial/react-sdk'
import { Particle } from './particle'

export interface EntityInfo {
  id?: string | number
  side: 'left' | 'right'
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
enableDebugTool()

function App() {
  const [isPlayGame, setIsPlayGame] = useState(false)
  const [isPauseGame, setIsPauseGame] = useState(false)
  const [entityList, setEntityList] = useState<EntityInfo[]>([])
  const [particleEntityList, setParticleEntityList] = useState<Particle[]>([])
  const entityListRef = useRef<EntityInfo[]>([])
  const particleEntityListRef = useRef<Particle[]>([])
  const [boxSize] = useState({
    width: 0.05,
    height: 0.05,
    depth: 0.05,
    cornerRadius: 0.01,
  })
  const [material] = useState({ left: 'matGreen', right: 'matRed' })
  const requestRef = useRef<number | null>(null)
  const frameRef = useRef<number>(0)
  const moveSpeed = 0.003
  const pauseGameRef = useRef<boolean>(false)

  const onClick = () => {
    console.log('start game')
    setIsPlayGame(true)
    frameRef.current = 0
  }

  const onTapLeft = async (e: SpatialTapEntityEvent) => {
    console.log('tap left', e.target.id)
    findAndRemoveNearestEntity('left')
  }

  const onTapRight = async (e: SpatialTapEntityEvent) => {
    console.log('tap right', e.target.id)
    findAndRemoveNearestEntity('right')
  }

  const findAndRemoveNearestEntity = (side: 'left' | 'right') => {
    let nearestEntity: EntityInfo | null = null
    const sideEntities = entityListRef.current.filter(
      entity => entity.side === side,
    )
    if (sideEntities.length) {
      let dist = 0.4 - sideEntities[0].position.z
      if (dist > -boxSize.depth && dist < boxSize.depth) {
        nearestEntity = sideEntities[0]
      }
    }
    if (nearestEntity) {
      let list = entityListRef.current
      list = list.filter(entity => entity.id !== nearestEntity.id)
      let particle = new Particle({
        layer: 4,
        size: boxSize.width,
        side: nearestEntity.side,
        moveSpeed,
        cornerRadius: boxSize.cornerRadius,
        originPos: nearestEntity.position,
      })
      setParticleEntityList(preList => [...preList, particle])
      console.log('remove', entityList)
      setEntityList(list)
    }
  }

  const createBox = () => {
    let rnd = Math.random() > 0.5
    let entityInfo: EntityInfo = {
      id: Math.random().toString(),
      side: rnd ? 'left' : 'right',
      position: {
        x: rnd ? -0.2 : 0.2,
        y: 0,
        z: 0,
      },
      materials: [rnd ? material.left : material.right],
    }
    console.log('create', entityList)
    return entityInfo
  }

  useEffect(() => {
    entityListRef.current = entityList
    console.log('update', entityList)
  }, [entityList])

  useEffect(() => {
    pauseGameRef.current = isPauseGame
  }, [isPauseGame])

  useEffect(() => {
    particleEntityListRef.current = particleEntityList
  }, [particleEntityList])

  useEffect(() => {
    if (isPlayGame) {
      console.log('start update game')
      function updateGame() {
        if (pauseGameRef.current) {
          return
        }
        frameRef.current++
        if (frameRef.current % 60 === 0) {
          let entityInfo = createBox()
          entityListRef.current.push(entityInfo)
        }
        if (entityListRef.current.length) {
          let list = entityListRef.current.map(entity => ({
            ...entity,
            position: {
              ...entity.position,
              z: entity.position.z + moveSpeed,
            },
          }))
          list = list.filter(entity => entity.position.z < 0.45)
          setEntityList(list)
        }
        if (particleEntityListRef.current.length) {
          let list = particleEntityListRef.current
            .map(particle => {
              let isAlive = particle.update()
              return isAlive ? particle : null
            })
            .filter(Boolean) as Particle[]
          setParticleEntityList(list)
        }
        requestRef.current = requestAnimationFrame(updateGame)
      }
      updateGame()
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
    }
  }, [isPlayGame])

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
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
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        '--xr-background-material': 'translucent',
      }}
    >
      {!isPlayGame && (
        <>
          <div style={{ color: 'white', fontSize: '70px', fontWeight: 'bold' }}>
            Let's Saber!
          </div>
          <div style={{ padding: '2em' }}>
            <button
              style={{
                marginTop: '40px',
                width: '200px',
                height: '80px',
                fontSize: '30px',
              }}
              onClick={onClick}
            >
              Start!
            </button>
          </div>
        </>
      )}
      {isPlayGame && (
        <>
          <button onClick={() => setIsPauseGame(!isPauseGame)}>
            {isPauseGame ? 'Resume' : 'Pause'}
          </button>
          <Reality
            style={{
              width: '100vw',
              height: '100vh',
            }}
          >
            <UnlitMaterial id={material.right} color="#ff0000" />
            <UnlitMaterial id={material.left} color="#00ff00" />
            <SceneGraph>
              <BoxEntity
                width={boxSize.width}
                height={boxSize.height}
                depth={0.01}
                cornerRadius={boxSize.cornerRadius}
                materials={[material.right]}
                position={{ x: 0.2, y: 0, z: 0.4 }}
                onSpatialTap={onTapRight}
              />
              <BoxEntity
                width={boxSize.width}
                height={boxSize.height}
                depth={0.01}
                cornerRadius={boxSize.cornerRadius}
                materials={[material.left]}
                position={{ x: -0.2, y: 0, z: 0.4 }}
                onSpatialTap={onTapLeft}
              />
              {entityList.map((entityInfo, index) => (
                <BoxEntity
                  key={entityInfo.id}
                  width={boxSize.width}
                  height={boxSize.height}
                  depth={boxSize.depth}
                  cornerRadius={boxSize.cornerRadius}
                  materials={entityInfo.materials}
                  position={entityInfo.position}
                />
              ))}
              {particleEntityList.map((particle, index) => {
                return particle
                  .getPartDatas()
                  .map(partData => (
                    <BoxEntity
                      key={partData.id}
                      width={boxSize.width}
                      height={boxSize.height}
                      depth={boxSize.depth}
                      cornerRadius={boxSize.cornerRadius}
                      materials={partData.materials}
                      position={partData.position}
                      scale={partData.scale}
                    />
                  ))
              })}
            </SceneGraph>
          </Reality>
        </>
      )}
    </div>
  )
}

export default App
