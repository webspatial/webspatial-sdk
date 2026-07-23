import { WebSpatialRuntime } from '@webspatial/react-sdk'
import { EntityAnimationPageShell } from './shared'

export default function EntityAnimationCapabilityCheckPage() {
  const supported = WebSpatialRuntime.supports('useAnimation', ['entity'])
  const supportedNoArgs = WebSpatialRuntime.supports('useAnimation')

  return (
    <EntityAnimationPageShell
      title="Capability Detection"
      description="Check whether the current runtime reports support for the useEntityAnimation hook; the runtime probe key remains useAnimation."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <p className="text-sm text-gray-400">
          <code className="text-cyan-300">
            WebSpatialRuntime.supports('useAnimation', ['entity'])
          </code>
        </p>
        <div
          className={`mt-4 inline-block rounded-lg px-4 py-2 text-sm font-mono ${
            supported
              ? 'border border-green-700 bg-green-900/50 text-green-300'
              : 'border border-red-700 bg-red-900/50 text-red-300'
          }`}
        >
          supports('useAnimation', ['entity']) = {String(supported)}
        </div>
        <div
          className={`mt-4 inline-block rounded-lg px-4 py-2 text-sm font-mono ${
            supportedNoArgs
              ? 'border border-green-700 bg-green-900/50 text-green-300'
              : 'border border-red-700 bg-red-900/50 text-red-300'
          }`}
        >
          supports('useAnimation') = {String(supportedNoArgs)}
        </div>
      </section>
    </EntityAnimationPageShell>
  )
}
