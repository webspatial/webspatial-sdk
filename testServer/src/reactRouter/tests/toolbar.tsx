import { SpatialDiv } from '@xrsdk/react'

export function ToolbarTest() {
  return (
    <>
      <div
        style={{
          backgroundColor: '#FF000000',
          width: '100%',
          height: '500px',
          padding: '0px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FF000000',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <SpatialDiv
            spatialStyle={{
              position: { z: 10, x: 0 },
              cornerRadius: 30,
              glassEffect: true,
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '50px',
              flexShrink: '0',
              marginRight: '-50px',
              padding: '5px',
            }}
          >
            <button>😍</button>
            <button>👌</button>
            <button>😊</button>
            <button>😇</button>
            <button>💘</button>
          </SpatialDiv>
          <SpatialDiv
            spatialStyle={{ position: { z: 1, x: 0, y: 0 }, glassEffect: true }}
            style={{
              height: '100%',
              margin: '0px',
              flexGrow: '1',
              fontSize: '3em',
              marginLeft: '25px',
              marginRight: '25px',
              backgroundColor: '#FF00F000',
              overflow: 'scroll',
            }}
          >
            <SpatialDiv
              spatialStyle={{ position: { z: 20 }, glassEffect: true }}
              style={{ width: '50%', backgroundColor: '#FFF0F000' }}
            >
              <p>Test</p>
            </SpatialDiv>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
            <div style={{ width: '50%', backgroundColor: '#FFF0F000' }}>
              <p>Test</p>
            </div>
          </SpatialDiv>
        </div>
      </div>
    </>
  )
}
