import React, { useState, CSSProperties, useRef, useEffect } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'
import { Spatial } from '@webspatial/core-sdk'

enableDebugTool()

function App() {
  const [count, setCount] = useState(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ;(window as any).btnRef = btnRef
  })
  console.log('spatialTest: ')

  // Mock spatial element states
  const [spatialElements, setSpatialElements] = useState([
    {
      id: 'element-1',
      position: [0, 0, 100],
      style: {
        '--xr-back': '100',
        '--xr-z-index': '100',
        backgroundColor: 'rgba(0, 0, 255, 0.7)',
        width: '200px',
        height: '150px',
        padding: '20px',
        borderRadius: '8px',
      } as CSSProperties,
    },
    {
      id: 'element-2',
      position: [150, 0, 50],
      style: {
        '--xr-back': '50',
        '--xr-z-index': '50',
        backgroundColor: 'rgba(0, 255, 0, 0.7)',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      } as CSSProperties,
    },
  ])

  const spatial = new Spatial()
  const session = spatial.requestSession()
  console.log('session: ', session)
  const supported = spatial.isSupported()
  console.log('supported: ', supported)
  async function inspectCurrentSpatialScene() {
    return await window.inspectCurrentSpatialScene()
  }

  inspectCurrentSpatialScene().then(scene => {
    console.log('inspectCurrentSpatialScene data: ', scene)
  })

  try {
    session?.getSpatialScene().updateSpatialProperties({
      material: 'translucent',
      cornerRadius: {
        topLeading: 100,
        bottomLeading: 100,
        topTrailing: 100,
        bottomTrailing: 100,
      },
    })
  } catch (error) {
    console.log('setBackgroundStyle failed')
  }

  const onClick = () => {
    setCount(count + 1)
    console.log('count: ', count)
    console.log('session: ', session)
    console.log('supported: ', supported)
    console.log('getNativeVersion: ', spatial.getNativeVersion())
    console.log('getClientVersion: ', spatial.getClientVersion())
    console.log('runInSpatialWeb: ', spatial.runInSpatialWeb())
    console.log('getSpatialScene: ', session?.getSpatialScene())

    console.log('getState: ', session?.getSpatialScene().getState())
    session?.getSpatialScene().updateSpatialProperties({
      material: 'translucent',
      cornerRadius: {
        topLeading: 10,
        bottomLeading: 10,
        topTrailing: 10,
        bottomTrailing: 10,
      },
    })

    // When clicked, update the z-position of the first spatial element
    setSpatialElements(prev => [
      {
        ...prev[0],
        position: [0, 0, prev[0].position[2] + 50],
        style: {
          ...prev[0].style,
          '--xr-back': prev[0].position[2] + 50,
          '--xr-z-index': prev[0].position[2] + 50,
        },
      },
      ...prev.slice(1),
    ])
  }

  const getNativeVersion = () => {
    const nativeVersion = spatial.getNativeVersion()
    console.log('getNativeVersion:', nativeVersion)
  }

  const getClientVersion = () => {
    const clientVersion = spatial.getClientVersion()
    console.log('getClientVersion:', clientVersion)
  }

  const runInSpatialWeb = () => {
    const runInSpatialWeb = spatial.runInSpatialWeb()
    console.log('runInSpatialWeb:', runInSpatialWeb)
  }

  const getSpatialScene = () => {
    const spatialScene = session?.getSpatialScene()
    console.log('getSpatialScene:', spatialScene)
  }

  const isSupported = () => {
    const isSupported = spatial.isSupported()
    console.log('isSupported:', isSupported)
  }

  const handleCreateNewElement = () => {
    const zPosition = Math.random() * 200 + 50
    const newElement = {
      id: `element-${Date.now()}`,
      position: [
        Math.random() * 300 - 150,
        Math.random() * 200 - 100,
        zPosition,
      ],
      style: {
        '--xr-back': zPosition,
        '--xr-z-index': zPosition,
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.7)`,
        width: `${Math.random() * 150 + 100}px`,
        height: `${Math.random() * 150 + 100}px`,
        padding: '15px',
      } as CSSProperties,
    }

    setSpatialElements(prev => [...prev, newElement])
  }

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1
        style={
          {
            '--xr-back': '100',
            backgroundColor: 'rgba(255, 0, 0, 0.7)',
          } as CSSProperties
        }
      >
        Web Spatial Test App
      </h1>

      {/* Counter Component */}
      <div style={{ marginBottom: '30px' }}>
        <h2 data-testid="counter">Count: {count}</h2>
        <button
          data-testid="btn"
          ref={btnRef}
          onClick={onClick}
          style={
            {
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
            } as CSSProperties
          }
        >
          Increment
        </button>
        <button
          onClick={handleCreateNewElement}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Create New Spatial Element
        </button>
        <button data-testid="isSupportedBtn" onClick={isSupported}>
          is supported
        </button>
        <button data-testid="getNativeVersionBtn" onClick={getNativeVersion}>
          get spatial native version
        </button>
        <button data-testid="getClientVersionBtn" onClick={getClientVersion}>
          get spatial client version
        </button>
        <button data-testid="runInSpatialWebBtn" onClick={runInSpatialWeb}>
          run in spatial web
        </button>
        <button data-testid="getSpatialSceneBtn" onClick={getSpatialScene}>
          get spatial scene
        </button>
      </div>

      {/* Spatial Elements Container */}
      <div
        style={{
          marginTop: '40px',
          border: '2px dashed #ccc',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        <h3>Spatial Elements</h3>
        <p>Click increment to move the blue box further back in 3D space</p>

        {/* Spatialized 2D Elements with --xr-back property */}
        {spatialElements.map((element, index) => (
          <div
            key={element.id}
            /// ref.current is the spatialized element info  input: ref.current, output: spatialized 2D element object info, windowproxy(content in html) inspect properties
            // ref={ref}
            className={`spatial-div spatial-element-${index + 1}`}
            style={{
              ...element.style,
              position: 'relative',
              margin: '10px',
              display: 'inline-block',
              border: '2px solid #333',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }}
          >
            <div>
              <strong>Element {index + 1}</strong>
              <div>ID: {element.id}</div>
              <div>Z-Position: {element.position[2]}px</div>
              <div>Click count: {count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Example Spatial Button */}
      <div style={{ marginTop: '30px' }}>
        <button
          style={
            {
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: 'purple',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 12px rgba(128, 0, 128, 0.3)',
            } as CSSProperties
          }
          onClick={() => console.log('Spatial button clicked')}
        >
          Spatial Button
        </button>
      </div>

      {/* Original Spatial Div */}
      <div
        data-testid="spatial-div"
        enable-xr
        style={
          {
            visibility: 'visible',
            display: 'block',
            '--xr-back': '100',
            '--xr-z-index': '100',
            '--xr-background-material': 'translucent',
            marginTop: '20px',
            padding: '20px',
            backgroundColor: 'rgba(255, 165, 0, 0.8)',
            border: '2px solid #ff8c00',
          } as CSSProperties
        }
      >
        this is spatial div with --xr-back: 100
      </div>
      <div
        data-testid="spatial-div-2"
        style={
          {
            enableXr: true,
            visibility: 'visible',
            display: 'block',
            '--xr-back': '150',
            '--xr-z-index': '100',
            '--xr-background-material': 'thin',
            marginTop: '20px',
            padding: '20px',
            backgroundColor: 'rgba(255, 165, 0, 0.8)',
            border: '2px solid #ff8c00',
          } as CSSProperties
        }
      >
        this is spatial div with enabled xr style
      </div>

      {/* Spatial Scene Information */}
      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <h3>Scene Info</h3>
        <p>Total Spatial Elements: {spatialElements.length}</p>
        <p>Last Interaction: {new Date().toLocaleTimeString()}</p>
        <p>Spatial Support: {supported ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}

export default App
