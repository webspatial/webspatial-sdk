import ReactDOM from 'react-dom/client'

import { enableDebugTool } from '@webspatial/react-sdk'
import EChartPage from './EChartPage'
import ThreeScene from './ThreeScene'
import ThreeSceneOutsideDivWithCanvas from './ThreeSceneOutsideDivWithJSXCanva'
import VideoTest from './VideoTest'
import CanvasPop from './CanvasPop'
import AudioTest from './AudioTest'

enableDebugTool()

function App() {
  return (
    <>
      <div
        enable-xr
        style={{
          marginTop: '10px',
          marginLeft: '10%',
          width: '80%',
          height: '100%',
          '--xr-background-material': 'translucent',
          '--xr-back': 300,
        }}
      >
        <AudioTest />
      </div>

      {/* <ThreeSceneOutsideDivWithCanvas /> */}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
