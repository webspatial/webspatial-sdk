import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'
import { CSSProperties } from 'react'

enableDebugTool()

function App() {
  const styleContainer: CSSProperties = {
    enableXr: true,
  }

  const styleHead = {
    height: '200px',
    fontSize: '50px',
    color: 'white',
    background: 'linear-gradient(to bottom, yellow, green)',
  }

  const styleLongContent = {
    height: '200vh',
    fontSize: '50px',
    color: 'white',
    background: 'linear-gradient(to bottom, blue, green)',
    '--xr-back': 121,
  }

  return (
    <div style={styleContainer}>
      <div style={styleHead}> head </div>
      <div style={styleLongContent} enable-xr>
        long content
      </div>
    </div>
  )
}

export default App
