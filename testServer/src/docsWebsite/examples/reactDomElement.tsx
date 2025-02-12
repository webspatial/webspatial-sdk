import { SpatialSession } from '@xrsdk/runtime'
import { useState } from 'react'
import { showSample } from './sampleLoader'
import { SpatialDiv } from '@xrsdk/react/dist'
import { Euler, Quaternion } from 'three'

function MySample(_props: { session?: SpatialSession }) {
  var [rotation, setRotation] = useState(0)
  return (
    <div className="m-10">
      <input
        type="range"
        step="0.005"
        min={-Math.PI * 2}
        max={Math.PI * 2}
        className="mt-10 m-10 w-60 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
        onChange={async e => {
          setRotation(Number(e.target.value))
        }}
      ></input>
      <div className="flex">
        <SpatialDiv
          spatialStyle={{
            position: { z: 50 },
            cornerRadius: 10,
            rotation: new Quaternion().setFromEuler(new Euler(0, rotation, 0)),
          }}
          style={{
            width: '90px',
            height: '90px',
            backgroundColor: '#FF000011',
          }}
        >
          Hello world
        </SpatialDiv>
        <SpatialDiv
          spatialStyle={{
            position: { z: 70 },
            cornerRadius: 10,
            rotation: new Quaternion().setFromEuler(new Euler(0, 0, rotation)),
          }}
          style={{
            width: '90px',
            height: '90px',
            backgroundColor: '#00FF0011',
          }}
        >
          Hello world
        </SpatialDiv>
        <SpatialDiv
          spatialStyle={{
            position: { z: 90 },
            cornerRadius: 10,
            rotation: new Quaternion().setFromEuler(new Euler(rotation, 0, 0)),
          }}
          style={{
            width: '90px',
            height: '90px',
            backgroundColor: '#0000FF11',
          }}
        >
          Hello world
        </SpatialDiv>
      </div>
    </div>
  )
}
showSample(MySample)
