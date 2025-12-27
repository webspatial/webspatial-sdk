import ReactDOM from 'react-dom/client'

import { enableDebugTool, Model } from '@webspatial/react-sdk'
import { useState } from 'react'

enableDebugTool()

function App() {
  const [status, setStatus] = useState("");
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Static 3D model test</h1>
      <Model
        enable-xr
        style={{ width: '800px', height: '200px', '--xr-depth': '100px' }}
        src={'/public/modelasset/Duck.glb'}
        onError={event => setStatus(`Model load error`)} 
        onLoad={event => {
          setStatus("Model load success");
          setCount(count + 1)
        }}
      />
      <p>{status} {count}</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
