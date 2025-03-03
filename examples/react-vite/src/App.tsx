import * as React from 'react'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { SpatialDiv } from '@webspatial/react-sdk'
import { Spatial } from '@webspatial/core-sdk'

const spatial = new Spatial()
const spatialSupported = spatial.isSupported()

if (spatialSupported) {
  var session = new Spatial().requestSession()
  session!.getCurrentWindowComponent().setStyle({
    material: { type: 'translucent' },
    cornerRadius: 50,
  })
}
document.documentElement.style.backgroundColor = 'transparent'
function App() {
  const [count, setCount] = useState(0)
  const spatialStyle = {
    color: 'red',
    backgrondColor: 'black',
    position: { x: 0, y: 0, z: 1.000001 },
    transparentEffect: false,
    glassEffect: false,
    // materialThickness: "none"
  }
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>

        <SpatialDiv spatialStyle={spatialStyle}>
          {' '}
          this is spatial div{' '}
        </SpatialDiv>

        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
