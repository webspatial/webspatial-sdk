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
import AnimateTest from './src/animate/index'
import RealityTest from './src/reality/index'
import RealityDebug from './src/reality/debug'
import RealityDynamic3D from './src/reality/dynamic3d'
import RealityGestures from './src/reality/gestures'
import RealitySpatialDiv from './src/reality/spatialDivDynamic'
import BasicTransform from './src/basic-transform/index'
import ModelTest from './src/model-test/index'
import SpatialStyleTest from './src/spatialStyleTest/index'
import CanvasTest from './src/canvas-test/index'
import JSAPITest from './src/jsapi-test/index'
import SceneTest from './src/scene/index'
import SceneHook from './src/scene/hook'
import SceneLoading from './src/scene/loading'
import SceneVolume from './src/scene/volume'
import SceneVolumeHook from './src/scene/volumeHook'
import SceneXRApp from './src/scene/xrapp'
import RealityEmpty from './src/reality/empty'
import RealityGeometryEntity from './src/reality/geometryEntity'
import RealityInteractable from './src/reality/interactable'
import RealityIssue from './src/reality/issue'
import RealityLow from './src/reality/low'
import RealityNested from './src/reality/nested'
import RealityTestIndex from './src/reality-test/index'
import SpatialDragGesture from './src/spatial-drag-gesture/index'
import SpatialGuesture from './src/spatial-guesture/index'
import SpatialMagnifyGesture from './src/spatial-magnify-gesture/index'
import SpatialRotationGesture from './src/spatial-rotation-gesture/index'
import BackgroundMaterial from './src/backgroundmaterial/index'
import FixedPositionTest from './src/FixedPositionTest/index'
import AndroidBringup from './src/androidBringup/index'
import DisplayTest from './src/displayTest/index'
import MemoryStats from './src/memoryStats/index'
import NestedFixPosition from './src/nestedfixposition/index'
import NestedScroll from './src/nestedscroll/index'
import SpatialConverter from './src/spatial-converter/index'
import SpatialCorner from './src/spatialCorner/index'
import Static3DModel from './src/static-3d-model/index'
import VisibleTest from './src/visibleTest/index'
import { CleanupSpa, CleanupIframe, CleanupModel } from './src/cleanup'

const NavigateTo = ({ href, replace }: { href: string; replace?: boolean }) => {
  React.useEffect(() => {
    if (replace) {
      window.location.replace(href)
    } else {
      window.location.assign(href)
    }
  }, [href, replace])
  return null
}

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
  return (
    <Router>
      <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto relative">
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

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
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

  // Force page height to 100%
  document.documentElement.style.height = '100%'
  document.body.style.height = '100%'
  rootElement.style.height = '100%'
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
