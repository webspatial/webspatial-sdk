import { useState } from 'react'
import { SpatialDiv } from '@webspatial/react-sdk'

var redCol = '#cc111144'
var greenCol = '#11cc1144'
var blueCol = '#1111cc44'

export function NestedDivsTest() {
  const [depth, setDepth] = useState(1)
  return (
    <>
      <input
        style={{ width: '30%' }}
        type="range"
        min={0}
        max="3"
        step={0.01}
        className="range"
        onChange={e => {
          setDepth(Number(e.target.value) + 0.01)
        }}
      />

      <div className="grid grid-cols-4 gap-4">
        <SpatialDiv
          debugName="PARENT A ROOT"
          spatialStyle={{
            position: { z: depth * 10, x: 0, y: 0 },
            material: {
              type: 'regular',
            },
          }}
          style={{ height: 300, backgroundColor: redCol }}
        >
          <p>Hello world A</p>
          <SpatialDiv
            debugName="CHILD A1"
            spatialStyle={{
              position: { z: depth * 30, x: 0, y: 0 },
              material: {
                type: 'regular',
              },
            }}
            style={{ height: 100, backgroundColor: blueCol }}
          >
            <p>Hello world B</p>
          </SpatialDiv>
        </SpatialDiv>
        <SpatialDiv
          debugName="PARENT B ROOT"
          spatialStyle={{
            position: { z: depth * 10, x: 0, y: 0 },
            material: {
              type: 'regular',
            },
          }}
          style={{ height: 300, backgroundColor: redCol }}
        >
          <p>Hello world A</p>
          <SpatialDiv
            debugName="CHILD B1"
            spatialStyle={{
              position: { z: depth * 30, x: 0, y: 0 },
              material: {
                type: 'regular',
              },
            }}
            style={{ height: 100, backgroundColor: blueCol }}
          >
            <p>Hello world B</p>
            <SpatialDiv
              debugName="CHILD B2"
              spatialStyle={{
                position: { z: depth * 30, x: 0, y: 0 },
                material: {
                  type: 'regular',
                },
              }}
              style={{ height: 100, backgroundColor: greenCol }}
            >
              <p>Hello world C</p>
              <SpatialDiv
                debugName="CHILD B3"
                spatialStyle={{
                  position: { z: depth * 30, x: 0, y: 0 },
                  material: {
                    type: 'regular',
                  },
                }}
                style={{ height: 100, backgroundColor: blueCol }}
              >
                <p>Hello world D</p>
                <SpatialDiv
                  debugName="CHILD B3"
                  spatialStyle={{
                    position: { z: depth * 30, x: 0, y: 0 },
                    material: {
                      type: 'regular',
                    },
                  }}
                  style={{ height: 100, backgroundColor: redCol }}
                >
                  <p>Hello world E</p>
                  <SpatialDiv
                    debugName="CHILD B3"
                    spatialStyle={{
                      position: { z: depth * 30, x: 0, y: 0 },
                      material: {
                        type: 'regular',
                      },
                    }}
                    style={{ height: 100, backgroundColor: blueCol }}
                  >
                    <p>Hello world F</p>
                    <SpatialDiv
                      debugName="CHILD B3"
                      spatialStyle={{
                        position: { z: depth * 30, x: 0, y: 0 },
                        material: {
                          type: 'regular',
                        },
                      }}
                      style={{ height: 100, backgroundColor: greenCol }}
                    >
                      <p>Hello world G</p>
                    </SpatialDiv>
                  </SpatialDiv>
                </SpatialDiv>
              </SpatialDiv>
            </SpatialDiv>
          </SpatialDiv>
        </SpatialDiv>
        <SpatialDiv
          debugName="PARENT C ROOT"
          spatialStyle={{
            position: { z: depth * 10, x: 0, y: 0 },
          }}
          style={{ height: 120, backgroundColor: redCol }}
        >
          <p>Hello world A</p>
          <SpatialDiv
            debugName="CHILD C1"
            spatialStyle={{
              position: { z: depth * 30, x: 0, y: 0 },
            }}
            style={{ height: 150, backgroundColor: blueCol }}
          >
            <p>Hello world B</p>
          </SpatialDiv>
        </SpatialDiv>

        <div style={{ backgroundColor: redCol, height: '50px' }}>02</div>
        <div style={{ backgroundColor: redCol, height: '50px' }}>02</div>
        <div style={{ backgroundColor: redCol, height: '50px' }}>02</div>
        <div style={{ backgroundColor: redCol, height: '50px' }}>09</div>
      </div>
    </>
  )
}
