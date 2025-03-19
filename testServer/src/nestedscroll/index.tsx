// @ts-nocheck
import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const styleContainer = {
    enableXr: true,
  }

  const styleHead = {
    height: '200px',
    background: 'linear-gradient(to bottom, yellow, green)',
  }

  const styleLongContent = {
    height: '200vh',
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

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
