import { useState } from 'react'
import './CubeComponent.scss'
import { CSSProperties } from 'styled-components'

export interface CubeProps {
  depth: number
  rotateZVal: number
}

export const Cube = (props: CubeProps) => {
  const { depth, rotateZVal } = props
  const cubeStyle = {
    '--xr-back': depth,
    transform: `rotateZ(${rotateZVal}deg)`,
  }

  return (
    <div className="cube" style={cubeStyle as CSSProperties} enable-xr>
      <div enable-xr className="cube__face cube__face--front">
        front
      </div>
      <div enable-xr className="cube__face cube__face--back">
        back
      </div>
      <div enable-xr className="cube__face cube__face--right">
        right
      </div>
      <div enable-xr className="cube__face cube__face--left">
        left
      </div>
      <div enable-xr className="cube__face cube__face--top">
        top
      </div>
      <div enable-xr className="cube__face cube__face--bottom">
        bottom
      </div>
    </div>
  )
}

export const CubeComponent = () => {
  const [v, setV] = useState(40)
  const [rotateZ, setRotateZ] = useState(45)

  return (
    <>
      set depth:
      <input
        type="range"
        style={{ width: '30%' }}
        min={0}
        max="100"
        value={v}
        onChange={e => {
          setV(Number(e.target.value) + 0.01)
        }}
        className="range"
      />
      set rotateZ degree:
      <input
        type="range"
        style={{ width: '30%' }}
        min={0}
        max="360"
        value={rotateZ}
        onChange={e => {
          setRotateZ(Number(e.target.value))
        }}
        className="range"
      />
      <Cube depth={v} rotateZVal={rotateZ} />
    </>
  )
}
