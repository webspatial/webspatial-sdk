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

function IframePage({ src, background }: { src: string; background?: string }) {
  return (
    <div className="w-full h-full">
      <iframe
        src={src}
        style={{
          width: '100%',
          height: '100%',
          border: '0',
          background: background ?? 'transparent',
        }}
        title={src}
      />
    </div>
  )
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
                <Route
                  path="/scene/hook"
                  element={<IframePage src="/scene/hook.html" />}
                />
                <Route
                  path="/scene/loading"
                  element={<IframePage src="/scene/loading.html" />}
                />
                <Route
                  path="/scene/volume"
                  element={<IframePage src="/scene/volume.html" />}
                />
                <Route
                  path="/scene/volume-hook"
                  element={<IframePage src="/scene/volumeHook.html" />}
                />
                <Route
                  path="/scene/xrapp"
                  element={<IframePage src="/scene/xrapp.html" />}
                />
                <Route
                  path="/scene/nosdk"
                  element={<IframePage src="/scene/nosdk.html" />}
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
                <Route
                  path="/reality/empty"
                  element={<IframePage src="/reality/empty.html" />}
                />
                <Route
                  path="/reality/geometry-entity"
                  element={<IframePage src="/reality/geometryEntity.html" />}
                />
                <Route
                  path="/reality/interactable"
                  element={<IframePage src="/reality/interactable.html" />}
                />
                <Route
                  path="/reality/issue"
                  element={<IframePage src="/reality/issue.html" />}
                />
                <Route
                  path="/reality/low"
                  element={<IframePage src="/reality/low.html" />}
                />
                <Route
                  path="/reality/nested"
                  element={<IframePage src="/reality/nested.html" />}
                />
                <Route
                  path="/reality-test"
                  element={<IframePage src="/reality-test/index.html" />}
                />
                <Route
                  path="/spatial-drag-gesture"
                  element={
                    <IframePage src="/spatial-drag-gesture/index.html" />
                  }
                />
                <Route
                  path="/spatial-guesture"
                  element={<IframePage src="/spatial-guesture/index.html" />}
                />
                <Route
                  path="/spatial-magnify-gesture"
                  element={
                    <IframePage src="/spatial-magnify-gesture/index.html" />
                  }
                />
                <Route
                  path="/spatial-rotation-gesture"
                  element={
                    <IframePage src="/spatial-rotation-gesture/index.html" />
                  }
                />
                <Route
                  path="/background-material"
                  element={<IframePage src="/backgroundmaterial/index.html" />}
                />
                <Route
                  path="/fixed-position-test"
                  element={<IframePage src="/FixedPositionTest/index.html" />}
                />
                <Route
                  path="/android-bringup"
                  element={<IframePage src="/androidBringup/index.html" />}
                />
                <Route
                  path="/display-test"
                  element={<IframePage src="/displayTest/index.html" />}
                />
                <Route
                  path="/memory-stats"
                  element={<IframePage src="/memoryStats/index.html" />}
                />
                <Route
                  path="/nested-fix-position"
                  element={<IframePage src="/nestedfixposition/index.html" />}
                />
                <Route
                  path="/nested-scroll"
                  element={<IframePage src="/nestedscroll/index.html" />}
                />
                <Route
                  path="/spatial-converter"
                  element={<IframePage src="/spatial-converter/index.html" />}
                />
                <Route
                  path="/spatial-corner"
                  element={<IframePage src="/spatialCorner/index.html" />}
                />
                <Route
                  path="/static-3d-model"
                  element={
                    <IframePage
                      src="/static-3d-model/index.html"
                      background="#fff"
                    />
                  }
                />
                <Route
                  path="/visible-test"
                  element={<IframePage src="/visibleTest/index.html" />}
                />
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
