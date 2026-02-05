import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './src/components/Sidebar'
import Home from './src/pages/Home'

// Lazy load components
const AnimateTest = lazy(() => import('./src/animate/index'))
const RealityTest = lazy(() => import('./src/reality/index'))
const RealityDebug = lazy(() => import('./src/reality/debug'))
const RealityDynamic3D = lazy(() => import('./src/reality/dynamic3d'))
const RealityGestures = lazy(() => import('./src/reality/gestures'))
const RealitySpatialDiv = lazy(() => import('./src/reality/spatialDivDynamic'))
const BasicTransform = lazy(() => import('./src/basic-transform/index'))
const ModelTest = lazy(() => import('./src/model-test/index'))
const SpatialStyleTest = lazy(() => import('./src/spatialStyleTest/index'))
const CanvasTest = lazy(() => import('./src/canvas-test/index'))
const JSAPITest = lazy(() => import('./src/jsapi-test/index'))
const SceneTest = lazy(() => import('./src/scene/index'))

// Placeholder for other tests until refactored
const Placeholder = ({ name }: { name: string }) => (
  <div className="p-10 text-white">
    <h1 className="text-2xl mb-4">{name}</h1>
    <p className="text-gray-400">
      This test is still being refactored into the SPA.
    </p>
  </div>
)

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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/animate" element={<AnimateTest />} />
              <Route path="/reality" element={<RealityTest />} />
              <Route path="/reality/debug" element={<RealityDebug />} />
              <Route path="/reality/dynamic3d" element={<RealityDynamic3D />} />
              <Route path="/reality/gestures" element={<RealityGestures />} />
              <Route
                path="/reality/spatial-div"
                element={<RealitySpatialDiv />}
              />
              <Route path="/basic-transform" element={<BasicTransform />} />
              <Route path="/model-test" element={<ModelTest />} />
              <Route path="/spatialStyleTest" element={<SpatialStyleTest />} />
              <Route path="/canvas-test" element={<CanvasTest />} />
              <Route path="/jsapi-test" element={<JSAPITest />} />
              <Route path="/scene" element={<SceneTest />} />
            </Routes>
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
