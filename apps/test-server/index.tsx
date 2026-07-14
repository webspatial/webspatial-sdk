import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'
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
import GestureDiv from './src/pages/reality/gestureDiv'
import RealitySpatialDiv from './src/pages/reality/spatialDivDynamic'
import BasicTransform from './src/pages/basic-transform/index'
import ModelTest from './src/pages/model-test/index'
import SpatialStyleTest from './src/pages/spatialStyleTest/index'
import StyledComponentsSpatialTest from './src/pages/styledComponentsSpatialTest/index'
import CanvasTest from './src/pages/canvas-test/index'
import JSAPITest from './src/pages/jsapi-test/index'
import SpatialDivRefreshValidation from './src/pages/jsapi-refresh-validation/index'
import SceneTest from './src/pages/scene/index'
import SceneVolume from './src/pages/scene/volume'
import SceneXRApp from './src/pages/scene/xrapp'
import RealityEmpty from './src/pages/reality/empty'
import RealityGeometryEntity from './src/pages/reality/geometryEntity'
import RealityInteractable from './src/pages/reality/interactable'
import RealityIssue from './src/pages/reality/issue'
import RealityLow from './src/pages/reality/low'
import RealityNested from './src/pages/reality/nested'
import RealityAttachments from './src/pages/reality/attachments'
import RealityDynamicAssets from './src/pages/reality/dynamicAssets'
import RealityTexturedUnlitBox from './src/pages/reality/texturedUnlitBox'
import RealityTestIndex from './src/pages/reality-test/index'
import RealityAliases from './src/pages/reality/aliases'
import SpatialDragGesture from './src/pages/spatial-drag-gesture/index'
import SpatialGuesture from './src/pages/spatial-guesture/index'
import SpatialMagnifyGesture from './src/pages/spatial-magnify-gesture/index'
import SpatialRotationGesture from './src/pages/spatial-rotation-gesture/index'
import SpatialRotateAxisConstraint from './src/pages/spatial-rotate-axis-constraint/index'
import BackgroundMaterial from './src/pages/backgroundmaterial/index'
import FixedPositionTest from './src/pages/FixedPositionTest/index'
import DisplayTest from './src/pages/displayTest/index'
import MemoryStats from './src/pages/memoryStats/index'
import NestedFixPosition from './src/pages/nestedfixposition/index'
import NestedScroll from './src/pages/nestedscroll/index'
import NestedSpatialOverflow from './src/pages/nested-spatial-overflow/index'
import SpatialConverter from './src/pages/spatial-converter/index'
import SpatialCorner from './src/pages/spatialCorner/index'
import GeometryVerify from './src/pages/geometry-verify/index'
import TransformVerify from './src/pages/transform-verify/index'
import Static3DModel from './src/pages/static-3d-model/index'
import NestedStatic3DModelReady from './src/pages/static-3d-model/nested-ready'
import VisibleTest from './src/pages/visibleTest/index'
import { CleanupSpa, CleanupIframe, CleanupModel } from './src/pages/cleanup'
import HeadStyleSyncPage from './src/pages/head-style-sync/index'
import UnitConvertTest from './src/pages/unitConvert'
import CoordConvertTest from './src/pages/reality/coordConvertTest'
import SpatialDivCoordTest from './src/pages/reality/spatialDivCoordTest'
import EntitySpatialDivConvertTest from './src/pages/reality/entitySpatialDivConvertTest'
import ModelSpatialDivConvertTest from './src/pages/reality/modelSpatialDivConvertTest'
import SpatialDivTest from './src/pages/spatialDivTest/index'
import SpatialContentReadyThree from './src/pages/spatial-content-ready-three/index'
import DropdownMenuTest from './src/pages/dropdown-menu-test/index'
import RuntimeCapabilitiesPage from './src/pages/runtime-capabilities/index'
import EntityAnimationPage from './src/pages/entity-animation/index'
import EntityAnimationEntrancePage from './src/pages/entity-animation/entrance'
import EntityAnimationManualTriggerPage from './src/pages/entity-animation/manual-trigger'
import EntityAnimationReverseLoopPage from './src/pages/entity-animation/reverse-loop'
import EntityAnimationCancelSyncPage from './src/pages/entity-animation/cancel-sync'
import EntityAnimationCapabilityCheckPage from './src/pages/entity-animation/capability-check'
import EntityAnimationResetLoopPage from './src/pages/entity-animation/reset-loop'
import EntityAnimationPlayStatePage from './src/pages/entity-animation/play-state'
import SpatialElementMotionPage from './src/pages/spatial-element-motion/index'
import SpatialElementMotionRealityContainerPage from './src/pages/spatial-element-motion/reality-container'
import SpatialElementMotionStaticModelContainerPage from './src/pages/spatial-element-motion/static-model-container'
import SpatialElementMotionFadeInEntrancePage from './src/pages/spatial-element-motion/fade-in-entrance'
import SpatialElementMotionScaleExpandPage from './src/pages/spatial-element-motion/scale-expand'
import SpatialElementMotionOpacityFadePage from './src/pages/spatial-element-motion/opacity-fade'
import SpatialElementMotionPropertyTakeoverPage from './src/pages/spatial-element-motion/property-takeover'
import SpatialElementMotionCombinedDelayPage from './src/pages/spatial-element-motion/combined-delay'
import SpatialElementMotionPlaybackRatePage from './src/pages/spatial-element-motion/playback-rate'
import SpatialElementMotionRotate3dPage from './src/pages/spatial-element-motion/rotate-3d'
import SpatialElementMotionTransformTranslatePage from './src/pages/spatial-element-motion/transform-translate'
import SpatialElementMotionReverseLoopPage from './src/pages/spatial-element-motion/reverse-loop'
import SpatialElementMotionCapabilityCheckPage from './src/pages/spatial-element-motion/capability-check'
import SpatialElementMotionPlayStatePage from './src/pages/spatial-element-motion/play-state'
import SpatialElementMotionPerfComparisonPage from './src/pages/spatial-element-motion/perf-comparison'
import SpatialElementMotionLoopAnimationPage from './src/pages/spatial-element-motion/loop-animation'
import SpatialElementMotionNestedAnimationPage from './src/pages/spatial-element-motion/nested-animation'

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

function SpatialBootErrorPanel({ error }: { error: WebSpatialBootError }) {
  const cause = error.cause
  const causeMessage =
    cause instanceof Error ? cause.message : cause ? String(cause) : null

  return (
    <div className="min-h-screen bg-[#111827] p-8 text-gray-100">
      <div className="max-w-3xl rounded border border-red-500/50 bg-red-950/30 p-6">
        <h1 className="mb-3 text-xl font-semibold">
          WebSpatial runtime failed to boot
        </h1>
        <p className="mb-4 text-sm text-gray-300">{error.message}</p>
        {causeMessage ? (
          <pre className="overflow-auto rounded bg-black/40 p-3 text-xs text-red-100">
            {causeMessage}
          </pre>
        ) : null}
      </div>
    </div>
  )
}

function TestServerRoot() {
  const [bootError, setBootError] = React.useState<WebSpatialBootError | null>(
    null,
  )

  if (bootError) {
    return <SpatialBootErrorPanel error={bootError} />
  }

  return (
    <SpatialBoot
      onError={(err: WebSpatialBootError) => {
        console.error('[test-server] bootSpatial failed', err)
        setBootError(err)
      }}
    >
      <App />
    </SpatialBoot>
  )
}

function App() {
  const outerClass = 'flex min-h-screen'
  const mainClass = 'flex-1 overflow-visible relative'

  return (
    <Router>
      <div
        className={outerClass}
        style={{ backgroundColor: 'var(--spa-bg-color)' }}
      >
        <Sidebar />
        <main className={mainClass}>
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
                <Route
                  path="/styledComponentsSpatialTest"
                  element={<StyledComponentsSpatialTest />}
                />
                <Route path="/canvas-test" element={<CanvasTest />} />
                <Route path="/jsapi-test" element={<JSAPITest />} />
                <Route
                  path="/spatial-div-refresh-validation"
                  element={<SpatialDivRefreshValidation />}
                />
                <Route
                  path="/jsapi-refresh-validation"
                  element={<SpatialDivRefreshValidation />}
                />
                <Route
                  path="/runtime-capabilities"
                  element={<RuntimeCapabilitiesPage />}
                />
                <Route
                  path="/entity-animation"
                  element={<EntityAnimationPage />}
                />
                <Route
                  path="/entity-animation/entrance"
                  element={<EntityAnimationEntrancePage />}
                />
                <Route
                  path="/entity-animation/manual-trigger"
                  element={<EntityAnimationManualTriggerPage />}
                />
                <Route
                  path="/entity-animation/reverse-loop"
                  element={<EntityAnimationReverseLoopPage />}
                />
                <Route
                  path="/entity-animation/cancel-sync"
                  element={<EntityAnimationCancelSyncPage />}
                />
                <Route
                  path="/entity-animation/capability-check"
                  element={<EntityAnimationCapabilityCheckPage />}
                />
                <Route
                  path="/entity-animation/reset-loop"
                  element={<EntityAnimationResetLoopPage />}
                />
                <Route
                  path="/entity-animation/play-state"
                  element={<EntityAnimationPlayStatePage />}
                />
                <Route
                  path="/spatial-element-motion"
                  element={<SpatialElementMotionPage />}
                />
                <Route
                  path="/spatial-element-motion/reality-container"
                  element={<SpatialElementMotionRealityContainerPage />}
                />
                <Route
                  path="/spatial-element-motion/static-model-container"
                  element={<SpatialElementMotionStaticModelContainerPage />}
                />
                <Route
                  path="/spatial-element-motion/fade-in-entrance"
                  element={<SpatialElementMotionFadeInEntrancePage />}
                />
                <Route
                  path="/spatial-element-motion/scale-expand"
                  element={<SpatialElementMotionScaleExpandPage />}
                />
                <Route
                  path="/spatial-element-motion/opacity-fade"
                  element={<SpatialElementMotionOpacityFadePage />}
                />
                <Route
                  path="/spatial-element-motion/combined-delay"
                  element={<SpatialElementMotionCombinedDelayPage />}
                />
                <Route
                  path="/spatial-element-motion/playback-rate"
                  element={<SpatialElementMotionPlaybackRatePage />}
                />
                <Route
                  path="/spatial-element-motion/rotate-3d"
                  element={<SpatialElementMotionRotate3dPage />}
                />
                <Route
                  path="/spatial-element-motion/transform-translate"
                  element={<SpatialElementMotionTransformTranslatePage />}
                />
                <Route
                  path="/spatial-element-motion/property-takeover"
                  element={<SpatialElementMotionPropertyTakeoverPage />}
                />
                <Route
                  path="/spatial-element-motion/reverse-loop"
                  element={<SpatialElementMotionReverseLoopPage />}
                />
                <Route
                  path="/spatial-element-motion/capability-check"
                  element={<SpatialElementMotionCapabilityCheckPage />}
                />
                <Route
                  path="/spatial-element-motion/play-state"
                  element={<SpatialElementMotionPlayStatePage />}
                />
                <Route
                  path="/spatial-element-motion/perf-comparison"
                  element={<SpatialElementMotionPerfComparisonPage />}
                />
                <Route
                  path="/spatial-element-motion/loop-animation"
                  element={<SpatialElementMotionLoopAnimationPage />}
                />
                <Route
                  path="/spatial-element-motion/nested-animation"
                  element={<SpatialElementMotionNestedAnimationPage />}
                />
                <Route
                  path="/reality/dynamic3d-motion"
                  element={
                    <Navigate
                      to="/spatial-element-motion/reality-container"
                      replace
                    />
                  }
                />
                <Route path="/scene" element={<SceneTest />} />
                <Route path="/scene/volume" element={<SceneVolume />} />
                <Route path="/scene/xrapp" element={<SceneXRApp />} />
                <Route
                  path="/scene/nosdk"
                  element={<Placeholder name="nosdk unmigrated fixme:" />}
                />
                <Route path="/reality" element={<RealityTest />} />
                <Route path="/reality/debug" element={<RealityDebug />} />
                <Route
                  path="/reality/dynamic3d"
                  element={<RealityDynamic3D />}
                />
                <Route path="/reality/gestures" element={<RealityGestures />} />
                <Route path="/reality/gestureDiv" element={<GestureDiv />} />
                <Route
                  path="/reality/spatial-div"
                  element={<RealitySpatialDiv />}
                />
                <Route
                  path="/reality/attachments"
                  element={<RealityAttachments />}
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
                <Route
                  path="/reality/coordConvertTest"
                  element={<CoordConvertTest />}
                />
                <Route
                  path="/reality/spatial-div-coord"
                  element={<SpatialDivCoordTest />}
                />
                <Route
                  path="/reality/entity-spatial-div-convert"
                  element={<EntitySpatialDivConvertTest />}
                />
                <Route
                  path="/reality/model-spatial-div-convert"
                  element={<ModelSpatialDivConvertTest />}
                />
                <Route path="/reality/aliases" element={<RealityAliases />} />
                <Route
                  path="/reality/dynamicAssets"
                  element={<RealityDynamicAssets />}
                />
                <Route
                  path="/reality/textured-unlit-box"
                  element={<RealityTexturedUnlitBox />}
                />
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
                  path="/spatial-rotate-axis-constraint"
                  element={<SpatialRotateAxisConstraint />}
                />
                <Route
                  path="/background-material"
                  element={<BackgroundMaterial />}
                />
                <Route
                  path="/fixed-position-test"
                  element={<FixedPositionTest />}
                />
                <Route path="/display-test" element={<DisplayTest />} />
                <Route path="/memory-stats" element={<MemoryStats />} />
                <Route
                  path="/nested-fix-position"
                  element={<NestedFixPosition />}
                />
                <Route path="/nested-scroll" element={<NestedScroll />} />
                <Route
                  path="/nested-spatial-overflow"
                  element={<NestedSpatialOverflow />}
                />
                <Route
                  path="/spatial-converter"
                  element={<SpatialConverter />}
                />
                <Route path="/spatial-div-test" element={<SpatialDivTest />} />
                <Route
                  path="/spatial-content-ready-three"
                  element={<SpatialContentReadyThree />}
                />
                <Route
                  path="/dropdown-menu-test"
                  element={<DropdownMenuTest />}
                />
                <Route path="/spatial-corner" element={<SpatialCorner />} />
                <Route path="/geometry-verify" element={<GeometryVerify />} />
                <Route path="/transform-verify" element={<TransformVerify />} />
                <Route path="/static-3d-model" element={<Static3DModel />} />
                <Route
                  path="/static-3d-model/nested-ready"
                  element={<NestedStatic3DModelReady />}
                />
                <Route path="/visible-test" element={<VisibleTest />} />
                <Route
                  path="/head-style-sync"
                  element={<HeadStyleSyncPage />}
                />
                <Route path="/cleanup/spa" element={<CleanupSpa />} />
                <Route path="/cleanup/model" element={<CleanupModel />} />
                <Route path="/cleanup/iframe" element={<CleanupIframe />} />
                <Route path="/unit-convert" element={<UnitConvertTest />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </Router>
  )
}

/** HashRouter ignores pathname; deep links without `#` would otherwise show Home. */
function syncHashFromPathname() {
  const { pathname, search, hash } = window.location
  if (hash || pathname === '/' || pathname === '/index.html') return
  window.location.replace(
    `${window.location.origin}${pathname}${search}#${pathname}${search}`,
  )
}

const init = () => {
  syncHashFromPathname()

  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('Root element not found')
    return
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TestServerRoot />
    </React.StrictMode>,
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
