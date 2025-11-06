import ReactDOM from 'react-dom/client'

import { enableDebugTool, Model } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const style = {
    width: '300px',
    height: '300px',
    // '--xr-back': 100,
    // transform: 'rotateX(30deg)',
    backgroundColor: 'green',
  }
  return (
    <div>
      hello basic-transform
      <div enable-xr style={style} />
      tail end
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
