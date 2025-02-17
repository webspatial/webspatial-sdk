import { SpatialDiv } from '@xrsdk/react'
import { CornerRadius } from '@xrsdk/runtime'
import { useState } from 'react'

export function BackgroundMaterialTest() {
  const z = 100

  const [bottomLeading, setBottomLeading] = useState(10)
  const [bottomTrailing, setBottomTrailing] = useState(10)
  const [topLeading, setTopLeading] = useState(10)
  const [topTrailing, setTopTrailing] = useState(10)

  const cornerRadius: CornerRadius = {
    bottomLeading,
    bottomTrailing,
    topLeading,
    topTrailing,
  }
  return (
    <>
      <div className="text-orange-200 mx-2.5 my-2.5">
        <div className="">
          borderRadius bottomLeading:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={bottomLeading}
            onChange={e => {
              setBottomLeading(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius bottomTrailing:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={bottomTrailing}
            onChange={e => {
              setBottomTrailing(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius topLeading:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={topLeading}
            onChange={e => {
              setTopLeading(Number(e.target.value))
            }}
            className="range"
          />
        </div>

        <div>
          borderRadius topTrailing:
          <input
            type="range"
            style={{ width: '50%' }}
            min={0}
            max="200"
            value={topTrailing}
            onChange={e => {
              setTopTrailing(Number(e.target.value))
            }}
            className="range"
          />
        </div>
      </div>

      <div className="flex flex-row space-x-2 w-screen text-orange-500   text-center">
        <SpatialDiv
          spatialStyle={{
            position: { z, x: 0 },
            cornerRadius,
            material: {
              type: 'none',
            },
          }}
          style={{
            height: '100px',
          }}
          className="grow"
        >
          this is transparent material
        </SpatialDiv>

        <SpatialDiv
          spatialStyle={{
            position: { z, x: 0 },
            cornerRadius,
            material: {
              type: 'translucent',
            },
          }}
          style={{
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is glass material
        </SpatialDiv>

        <SpatialDiv
          spatialStyle={{
            position: { z, x: 0 },
            cornerRadius,
            material: {
              type: 'thin',
            },
          }}
          style={{
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is thin material
        </SpatialDiv>

        <SpatialDiv
          spatialStyle={{
            position: { z, x: 0 },
            cornerRadius,
            material: {
              type: 'regular',
            },
          }}
          style={{
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is regular material
        </SpatialDiv>

        <SpatialDiv
          spatialStyle={{
            position: { z, x: 0 },
            cornerRadius,
            material: {
              type: 'thick',
            },
          }}
          style={{
            height: '100px',
          }}
          className="grow bg-slate-50/50"
        >
          this is thick material
        </SpatialDiv>
      </div>
    </>
  )
}
