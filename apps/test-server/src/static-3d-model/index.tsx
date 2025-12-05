import ReactDOM from 'react-dom/client'

import { enableDebugTool, Model } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  return (
    <div>
      <h1>Static 3D model test</h1>
      <Model
        enable-xr
        style={{ width: '800px', height: '200px' }}
        src={'/public/modelasset/cone.usdz'}
      >
        <div> this is place holder when failure </div>
      </Model>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
