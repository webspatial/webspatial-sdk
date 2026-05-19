import { WebSpatialRuntime } from '@webspatial/react-sdk'
import { SpatialDivAnimationPageShell } from './shared'

export default function SpatialDivCapabilityCheckPage() {
  const supported = WebSpatialRuntime.supports('useAnimation', ['element'])
  const entitySupported = WebSpatialRuntime.supports('useAnimation', ['entity'])

  return (
    <SpatialDivAnimationPageShell
      title="Capability Detection"
      description="Probe the runtime for SpatialDiv animation support. The element token is independent of the entity token."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-400">
            <code className="text-cyan-300">
              WebSpatialRuntime.supports('useAnimation', ['element'])
            </code>
          </p>
          <div
            className={`mt-2 inline-block rounded-lg px-4 py-2 text-sm font-mono ${
              supported
                ? 'border border-green-700 bg-green-900/50 text-green-300'
                : 'border border-red-700 bg-red-900/50 text-red-300'
            }`}
          >
            supports('useAnimation', ['element']) = {String(supported)}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400">
            <code className="text-cyan-300">
              WebSpatialRuntime.supports('useAnimation', ['entity'])
            </code>{' '}
            (for comparison)
          </p>
          <div
            className={`mt-2 inline-block rounded-lg px-4 py-2 text-sm font-mono ${
              entitySupported
                ? 'border border-green-700 bg-green-900/50 text-green-300'
                : 'border border-red-700 bg-red-900/50 text-red-300'
            }`}
          >
            supports('useAnimation', ['entity']) = {String(entitySupported)}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          When the element token is <code>false</code>, calling{' '}
          <code>useAnimation</code> with SpatialDiv keys logs a one-time warning
          and returns a no-op API; <code>play()</code> becomes a no-op and{' '}
          <code>isAnimating</code> stays <code>false</code>.
        </p>
      </section>
    </SpatialDivAnimationPageShell>
  )
}
