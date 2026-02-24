import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './src/components/Sidebar'
import Home from './src/pages/Home'
// Static route registry: add your test component here to expose it in the SPA

const Placeholder = ({ name }: { name: string }) => (
  <div className="p-10 text-white">
    <h1 className="text-2xl mb-4">{name}</h1>
    <p className="text-gray-400">
      This test is still being refactored into the SPA.
    </p>
  </div>
)

// Simple static imports. To add a test, import it here and add a <Route>.
import AnimateTest from './src/pages/animate/index'
import RealityTest from './src/pages/reality/index'
import RealityDebug from './src/pages/reality/debug'
import RealityDynamic3D from './src/pages/reality/dynamic3d'
import RealityGestures from './src/pages/reality/gestures'
import RealitySpatialDiv from './src/pages/reality/spatialDivDynamic'
import BasicTransform from './src/pages/basic-transform/index'
import ModelTest from './src/pages/model-test/index'
import SpatialStyleTest from './src/pages/spatialStyleTest/index'
import CanvasTest from './src/pages/canvas-test/index'
import JSAPITest from './src/pages/jsapi-test/index'
import SceneTest from './src/pages/scene/index'
import SceneHook from './src/pages/scene/hook'
import SceneLoading from './src/pages/scene/loading'
import SceneVolume from './src/pages/scene/volume'
import SceneVolumeHook from './src/pages/scene/volumeHook'
import SceneXRApp from './src/pages/scene/xrapp'
import RealityEmpty from './src/pages/reality/empty'
import RealityGeometryEntity from './src/pages/reality/geometryEntity'
import RealityInteractable from './src/pages/reality/interactable'
import RealityIssue from './src/pages/reality/issue'
import RealityLow from './src/pages/reality/low'
import RealityNested from './src/pages/reality/nested'
import RealityTestIndex from './src/pages/reality-test/index'
import SpatialDragGesture from './src/pages/spatial-drag-gesture/index'
import SpatialGuesture from './src/pages/spatial-guesture/index'
import SpatialMagnifyGesture from './src/pages/spatial-magnify-gesture/index'
import SpatialRotationGesture from './src/pages/spatial-rotation-gesture/index'
import BackgroundMaterial from './src/pages/backgroundmaterial/index'
import FixedPositionTest from './src/pages/FixedPositionTest/index'
import AndroidBringup from './src/pages/androidBringup/index'
import DisplayTest from './src/pages/displayTest/index'
import MemoryStats from './src/pages/memoryStats/index'
import NestedFixPosition from './src/pages/nestedfixposition/index'
import NestedScroll from './src/pages/nestedscroll/index'
import SpatialConverter from './src/pages/spatial-converter/index'
import SpatialCorner from './src/pages/spatialCorner/index'
import Static3DModel from './src/pages/static-3d-model/index'
import VisibleTest from './src/pages/visibleTest/index'
import { CleanupSpa, CleanupIframe, CleanupModel } from './src/pages/cleanup'

class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }
  componentDidCatch(error: any, info: any) {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-300">Something went wrong.</div>
        </div>
      )
    }
    return this.props.children as any
  }
}

function App() {
  const outerClass = 'flex min-h-screen'
  const mainClass = 'flex-1 overflow-visible relative'

  return (
    <Router>
      <div
        className={outerClass}
        style={{ backgroundColor: 'var(--spa-bg-color, #ffffff)' }}
      >
        <Sidebar />
        <main className={mainClass} enable-xr-monitor>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/animate" element={<AnimateTest />} />
                <Route path="/basic-transform" element={<BasicTransform />} />
                <Route path="/model-test" element={<ModelTest />} />
                <Route
                  path="/spatialStyleTest"
                  element={<SpatialStyleTest />}
                />
                <Route path="/canvas-test" element={<CanvasTest />} />
                <Route path="/jsapi-test" element={<JSAPITest />} />
                <Route path="/scene" element={<SceneTest />} />
                <Route path="/scene/hook" element={<SceneHook />} />
                <Route path="/scene/loading" element={<SceneLoading />} />
                <Route path="/scene/volume" element={<SceneVolume />} />
                <Route
                  path="/scene/volume-hook"
                  element={<SceneVolumeHook />}
                />
                <Route path="/scene/xrapp" element={<SceneXRApp />} />
                <Route
                  path="/scene/nosdk"
                  element={<Placeholder name="nosdk unmigrated" />}
                />
                <Route path="/reality" element={<RealityTest />} />
                <Route path="/reality/debug" element={<RealityDebug />} />
                <Route
                  path="/reality/dynamic3d"
                  element={<RealityDynamic3D />}
                />
                <Route path="/reality/gestures" element={<RealityGestures />} />
                <Route
                  path="/reality/spatial-div"
                  element={<RealitySpatialDiv />}
                />
                <Route path="/reality/empty" element={<RealityEmpty />} />
                <Route
                  path="/reality/geometry-entity"
                  element={<RealityGeometryEntity />}
                />
                <Route
                  path="/reality/interactable"
                  element={<RealityInteractable />}
                />
                <Route path="/reality/issue" element={<RealityIssue />} />
                <Route path="/reality/low" element={<RealityLow />} />
                <Route path="/reality/nested" element={<RealityNested />} />
                <Route path="/reality-test" element={<RealityTestIndex />} />
                <Route
                  path="/spatial-drag-gesture"
                  element={<SpatialDragGesture />}
                />
                <Route path="/spatial-guesture" element={<SpatialGuesture />} />
                <Route
                  path="/spatial-magnify-gesture"
                  element={<SpatialMagnifyGesture />}
                />
                <Route
                  path="/spatial-rotation-gesture"
                  element={<SpatialRotationGesture />}
                />
                <Route
                  path="/background-material"
                  element={<BackgroundMaterial />}
                />
                <Route
                  path="/fixed-position-test"
                  element={<FixedPositionTest />}
                />
                <Route path="/android-bringup" element={<AndroidBringup />} />
                <Route path="/display-test" element={<DisplayTest />} />
                <Route path="/memory-stats" element={<MemoryStats />} />
                <Route
                  path="/nested-fix-position"
                  element={<NestedFixPosition />}
                />
                <Route path="/nested-scroll" element={<NestedScroll />} />
                <Route
                  path="/spatial-converter"
                  element={<SpatialConverter />}
                />
                <Route path="/spatial-corner" element={<SpatialCorner />} />
                <Route path="/static-3d-model" element={<Static3DModel />} />
                <Route path="/visible-test" element={<VisibleTest />} />
                <Route path="/cleanup/spa" element={<CleanupSpa />} />
                <Route path="/cleanup/model" element={<CleanupModel />} />
                <Route path="/cleanup/iframe" element={<CleanupIframe />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </Router>
  )
}

const init = () => {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('Root element not found')
    return
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
