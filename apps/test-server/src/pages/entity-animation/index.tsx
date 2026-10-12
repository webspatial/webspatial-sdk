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
          <code className="text-cyan-300">redesign-entity-motion-api</code>).
          Each page binds <code className="text-cyan-300">animation</code>,
          spreads native-confirmed{' '}
          <code className="text-cyan-300">entityProps</code>, and exercises the
          playback API.
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
              React transform probes are blocked during delay, running, and
              paused states, then accepted after playback becomes inactive.
            </li>
            <li>
              Reverse loop: box rotates back and forth and pause/resume works.
            </li>
            <li>
              Stop and sync: after stop, the next render keeps the stop-point.
            </li>
            <li>
              Capability: <code>supports('useEntityAnimation')</code> reports
              support on compatible WebSpatial runtimes.
            </li>
            <li>Reset loop: box moves, resets to the start, and repeats.</li>
            <li>
              In-place config update: execution changes keep the React animation
              reference stable; running and paused retargets preserve pose and
              state; callback-only updates use the latest callback.
            </li>
            <li>
              Binding ownership: unbind clears entityProps and restores React
              control; binding the same animation to a second Entity is rejected
              without disturbing the first.
            </li>
            <li>
              Callback scenarios report PASS only when start, complete, stop,
              and reset callbacks match their expected exactly-once counts.
            </li>
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
