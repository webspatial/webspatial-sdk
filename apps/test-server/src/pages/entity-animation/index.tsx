import { EntityAnimationOverview } from './shared'

export default function EntityAnimationPage() {
  return (
    <div className="min-h-full bg-[#0d0d0d] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold">Entity Transform Animation</h1>
        <p className="mb-2 max-w-3xl text-sm text-gray-400">
          Test pages for the{' '}
          <code className="text-cyan-300">useEntityAnimation</code> hook
          (OpenSpec:{' '}
          <code className="text-cyan-300">add-entity-transform-animation</code>
          ). Animations run natively at 90 fps via the JSBridge with no
          per-frame JS calls.
        </p>
        <p className="mb-8 max-w-3xl text-xs text-gray-500">
          Best tested in a WebSpatial runtime (visionOS). In a regular browser
          the capability check returns false and animations will not play; the
          UI and callbacks remain exercisable.
        </p>

        <EntityAnimationOverview />

        <section className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
          <h3 className="mb-2 font-medium text-gray-400">
            Manual verification checklist (visionOS)
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Entrance: box rises and scales up after 0.3 s delay.</li>
            <li>
              Manual: play moves box left-to-right and stop freezes mid-flight.
            </li>
            <li>
              Reverse loop: box rotates back and forth and pause/resume works.
            </li>
            <li>
              Stop and sync: after stop, the next render keeps the stop-point.
            </li>
            <li>
              Capability: <code>supports('useAnimation', ['entity'])</code>{' '}
              probes the runtime key for <code>useEntityAnimation</code> and is
              true in WebSpatial runtime and false otherwise.
            </li>
            <li>Reset loop: box moves, resets to the start, and repeats.</li>
            <li>
              All lifecycle callbacks appear in the log panel when the runtime
              supports the animation flow.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
