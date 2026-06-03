import { Link } from 'react-router-dom'
import { enableDebugTool } from '@webspatial/react-sdk'
import { SpatialDivAnimationOverview } from './shared'

enableDebugTool()

export default function SpatializedMotionHubPage() {
  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Spatialized Motion</h1>
      <p className="text-sm text-gray-400 mb-6">
        Declarative timeline + playback API across spatialized containers.
        Public hook: <code>useAnimation</code>. OpenSpec:{' '}
        <code>spatial-div-motion-api</code>,{' '}
        <code>spatialized-element-motion-api</code>.
      </p>

      <div className="mb-8">
        <SpatialDivAnimationOverview />
      </div>

      <h2 className="text-lg font-semibold mb-2 text-gray-400">Other</h2>
      <Link className="text-gray-400 hover:underline" to="/animate">
        /animate (react-spring, GSAP, …)
      </Link>
    </div>
  )
}
