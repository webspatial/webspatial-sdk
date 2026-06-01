import { WebSpatialRuntime } from '@webspatial/react-sdk'
import { SpatialDivAnimationPageShell } from './shared'

export default function SpatialDivCapabilityCheckPage() {
  const allSupported = WebSpatialRuntime.supports('useSpatializedMotion')
  const spatialized2DSupported = WebSpatialRuntime.supports(
    'useSpatializedMotion',
    ['spatialized2d'],
  )
  const static3DSupported = WebSpatialRuntime.supports('useSpatializedMotion', [
    'static3d',
  ])
  const dynamic3DSupported = WebSpatialRuntime.supports(
    'useSpatializedMotion',
    ['dynamic3d'],
  )

  const kindRows = [
    ['spatialized2d', spatialized2DSupported],
    ['static3d', static3DSupported],
    ['dynamic3d', dynamic3DSupported],
  ] as const

  return (
    <SpatialDivAnimationPageShell
      title="Capability Detection"
      description="Probe the runtime for Spatialized Motion support. Top-level support requires all motion kinds."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-400">
            <code className="text-cyan-300">
              WebSpatialRuntime.supports('useSpatializedMotion')
            </code>
          </p>
          <div
            className={`mt-2 inline-block rounded-lg px-4 py-2 text-sm font-mono ${
              allSupported
                ? 'border border-green-700 bg-green-900/50 text-green-300'
                : 'border border-red-700 bg-red-900/50 text-red-300'
            }`}
          >
            supports('useSpatializedMotion') = {String(allSupported)}
          </div>
        </div>

        {kindRows.map(([kind, supported]) => (
          <div key={kind}>
            <p className="text-sm text-gray-400">
              <code className="text-cyan-300">
                {`WebSpatialRuntime.supports('useSpatializedMotion', ['${kind}'])`}
              </code>
            </p>
            <div
              className={`mt-2 inline-block rounded-lg px-4 py-2 text-sm font-mono ${
                supported
                  ? 'border border-green-700 bg-green-900/50 text-green-300'
                  : 'border border-red-700 bg-red-900/50 text-red-300'
              }`}
            >
              {`supports('useSpatializedMotion', ['${kind}']) = ${String(
                supported,
              )}`}
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-500">
          When the spatialized2d token is <code>false</code>, calling{' '}
          <code>useSpatializedMotion</code> with SpatialDiv keys logs a one-time
          warning and returns a no-op API; <code>play()</code> becomes a no-op
          and <code>isAnimating</code> stays <code>false</code>.
        </p>
      </section>
    </SpatialDivAnimationPageShell>
  )
}
