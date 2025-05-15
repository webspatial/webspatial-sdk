import React, { CSSProperties, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const fixedSpatialDivStyle: CSSProperties = {
    '--xr-back': 100,
    position: 'fixed',
    left: 100,
    top: 100,
    width: '200px',
    height: '78px',
    color: 'blue',
    backgroundColor: 'yellow',
  }

  const parentSpatialDivStyle: CSSProperties = {
    '--xr-back': 36,
    backgroundColor: 'lightblue',
    position: 'relative',
  }

  const nestedSpatialDivStyle: CSSProperties = {
    '--xr-back': 6,
    backgroundColor: 'green',
    position: 'fixed',
    left: 10,
    top: 80,
  }

  const longStyle = {
    height: '50vh',
  }

  const [flag, setFlag] = useState(true)
  const onToggle = () => {
    setFlag(!flag)
  }

  return (
    <div className="w-screen h-screen  ">
      <div style={longStyle}>
        some infomation
        <div enable-xr style={fixedSpatialDivStyle}>
          <div>
            this is a fixed spatialdiv \n this is a fixed spatialdiv \n this is
            a fixed spatialdiv this is a fixed spatialdiv this is a fixed
            spatialdiv this is a fixed spatialdiv
          </div>
        </div>
      </div>
      <button onClick={onToggle}> toggle spatialdiv </button>
      {flag && (
        <div enable-xr style={parentSpatialDivStyle}>
          <p enable-xr style={{ '--xr-back': 50 }}>
            this is a parent spatialdiv
          </p>
          <div enable-xr style={nestedSpatialDivStyle}>
            this is a nested fixed spatialdiv
          </div>
          <div style={longStyle}>End of the parent spatialdiv </div>
        </div>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
