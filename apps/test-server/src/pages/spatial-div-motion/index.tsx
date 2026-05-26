import { Link } from 'react-router-dom'
import { enableDebugTool } from '@webspatial/react-sdk'
import { spatialDivAnimationRoutes } from '../spatial-div-animation/routes'
import { spatializedMotionDemoRoutes } from './routes'

enableDebugTool()

const demos2d = spatializedMotionDemoRoutes.filter(r => r.section === '2d')
const demos3d = spatializedMotionDemoRoutes.filter(r => r.section === '3d')

export default function SpatializedMotionHubPage() {
  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Spatialized Motion</h1>
      <p className="text-sm text-gray-400 mb-6">
        Declarative timeline + playback API across spatialized containers.
        OpenSpec: <code>spatial-div-motion-api</code>,{' '}
        <code>spatialized-element-motion-api</code>.
      </p>

      <h2 className="text-lg font-semibold mb-2 text-blue-300">
        2D — SpatialDiv
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Web RAF in browser; native timeline on visionOS when <code>motion</code>{' '}
        is bound.
      </p>
      <ul className="space-y-2 mb-8">
        {demos2d.map(r => (
          <li key={r.path}>
            <Link className="text-blue-400 hover:underline" to={r.path}>
              {r.label}
            </Link>
            <span className="text-gray-500 text-sm ml-2">{r.description}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2 text-violet-300">
        3D containers — native only
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Static3D Model and Dynamic3D Reality require visionOS shell ≥ 1.8.0
        (rebuild WebSpatial.app after SDK changes).
      </p>
      <ul className="space-y-2 mb-8">
        {demos3d.map(r => (
          <li key={r.path}>
            <Link className="text-violet-400 hover:underline" to={r.path}>
              {r.label}
            </Link>
            <span className="text-gray-500 text-sm ml-2">{r.description}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2 text-amber-300">
        Plan A — Session (reference)
      </h2>
      <ul className="space-y-2 mb-8">
        {spatialDivAnimationRoutes.map(r => (
          <li key={r.path}>
            <Link className="text-amber-400/90 hover:underline" to={r.path}>
              {r.label}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2 text-gray-400">Other</h2>
      <Link className="text-gray-400 hover:underline" to="/animate">
        /animate (react-spring, GSAP, …)
      </Link>
    </div>
  )
}
