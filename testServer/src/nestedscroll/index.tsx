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
    <div style={styleContainer} debugName="container">
      <div style={styleHead}> head </div>
      <div style={styleLongContent} enable-xr debugName="longcontent">
        long content
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
