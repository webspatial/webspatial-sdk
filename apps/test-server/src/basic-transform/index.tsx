import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'
import { CSSProperties } from 'react'

enableDebugTool()

function App() {
  const style = {
    width: '300px',
    height: '300px',
    '--xr-back': 100,
    // transform: 'rotateX(30deg)',
    backgroundColor: 'green',
  }

  const childStyle: CSSProperties = {
    width: '300px',
    height: '100px',
    position: 'relative',
    left: '120px',
    '--xr-back': 20,
    backgroundColor: 'red',
    // transform: '  rotateY(30deg)',
  }
  return (
    <div>
      hello basic-transform
      <div enable-xr style={style}>
        parent spatial div
        <div enable-xr style={childStyle}>
          this is child spatialdiv tom
        </div>
      </div>
      tail end
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
