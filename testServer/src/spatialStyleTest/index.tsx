import ReactDOM from 'react-dom/client'
import { CSSModelSample } from './CSSModelSample'
import { SpatialMonitor, enableDebugTool } from '@xrsdk/react'
import { SpatialTagComponent } from './SpatialTagComponent'
import { NestedComponent } from './NestedComponent'
import { CubeComponent } from './CubeComponent'
import { SimpleSpatialComponent } from './SimpleSpatialComponent'

enableDebugTool()

function App() {
  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <SpatialMonitor className="w-screen h-screen  ">
        <div className="flex flex-col">
          <SimpleSpatialComponent />
          <SpatialTagComponent />
          <NestedComponent />
          <CSSModelSample />
          <CubeComponent />
        </div>
      </SpatialMonitor>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
