import { WebSpatialRuntime } from '@webspatial/react-sdk'
import { SpatialElementMotionPageShell } from './shared'

export default function SpatialElementMotionCapabilityCheckPage() {
  const allSupported = WebSpatialRuntime.supports('useAnimation')

  return (
    <SpatialElementMotionPageShell
      title="Capability Detection"
      description="Probe the runtime for Spatialized Motion support."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-400">
            <code className="text-cyan-300">
              WebSpatialRuntime.supports('useAnimation')
            </code>
          </p>
          <div
            className={`mt-2 inline-block rounded-lg px-4 py-2 text-sm font-mono ${
              allSupported
                ? 'border border-green-700 bg-green-900/50 text-green-300'
                : 'border border-red-700 bg-red-900/50 text-red-300'
            }`}
          >
            supports('useAnimation') = {String(allSupported)}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          When <code>supports('useAnimation')</code> is <code>false</code>,
          calling <code>useAnimation</code> logs a one-time warning and returns
          a no-op API; <code>play()</code> becomes a no-op and{' '}
          <code>isAnimating</code> stays <code>false</code>.
        </p>
      </section>
    </SpatialElementMotionPageShell>
  )
}
