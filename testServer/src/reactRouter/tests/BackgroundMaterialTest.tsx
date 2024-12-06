import { SpatialDiv } from '@xrsdk/react'

export function BackgroundMaterialTest() {
  const z = 100
  const cornerRadius = 20
  return (
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
            type: 'default',
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
  )
}
