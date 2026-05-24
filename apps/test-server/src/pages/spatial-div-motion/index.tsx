import { Link } from 'react-router-dom'
import { enableDebugTool } from '@webspatial/react-sdk'
import { spatialDivAnimationRoutes } from '../spatial-div-animation/routes'

enableDebugTool()

const motionRoutes = [
  {
    path: '/spatial-div-motion/multi-track',
    label: 'Multi-track (canonical Plan B)',
    description: 'translateX 0–5s + opacity 3–5s overlap — auto-play',
  },
  {
    path: '/spatial-div-motion/simple-entrance',
    label: 'simple() entrance',
    description: 'fade + slide via sugar API — auto-play',
  },
]

export default function SpatialDivMotionHubPage() {
  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">
        SpatialDiv Motion API (Plan B)
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        RFC branch <code>proposal/spatial-div-motion-timeline</code>. See{' '}
        <code>openspec/changes/spatial-div-motion-api/COMPARISON.md</code>.
      </p>

      <h2 className="text-lg font-semibold mb-2 text-blue-300">
        Plan B — Motion
      </h2>
      <ul className="space-y-2 mb-8">
        {motionRoutes.map(r => (
          <li key={r.path}>
            <Link className="text-blue-400 hover:underline" to={r.path}>
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
