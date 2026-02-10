import ReactDOM from 'react-dom/client'
import { CSSModelSample } from './CSSModelSample'
import { enableDebugTool } from '@webspatial/react-sdk'
import { SpatialTagComponent } from './SpatialTagComponent'
import { NestedComponent } from './NestedComponent'
import { CubeComponent } from './CubeComponent'
import { SimpleSpatialComponent } from './SimpleSpatialComponent'
import { StyledTitleComponent } from './StyledTitleComponent'
import { StyledVisibilityComponent } from './StyledVisibilityComponent'

enableDebugTool()

function App() {
  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <div enable-xr-monitor className="w-screen h-screen  ">
        <div className="flex flex-col">
          <StyledVisibilityComponent />
          <SimpleSpatialComponent />
          <SpatialTagComponent />
          <StyledTitleComponent />
          <NestedComponent />
          <CSSModelSample />
          <CubeComponent />
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
