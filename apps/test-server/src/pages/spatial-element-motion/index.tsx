import { SpatialDivAnimationOverview } from './shared'

export default function SpatialDivAnimationPage() {
  return (
    <div className="min-h-full bg-[#0d0d0d] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold">Spatialized Element Motion</h1>
        <p className="mb-2 max-w-3xl text-sm text-gray-400">
          Test pages for Spatialized Element Motion via{' '}
          <code className="text-cyan-300">useAnimation</code> +{' '}
          <code className="text-cyan-300">
            {'<div enable-xr xr-animation={...}>'}
          </code>
          . The hook auto-dispatches to the target path based on the{' '}
          <code>to</code> key set.
        </p>
        <p className="mb-4 max-w-3xl text-xs text-gray-500">
          Requires the WebSpatial visionOS runtime with{' '}
          <code>AnimateSpatializedElementMotion</code> (
          <code>targetKind: spatialized2d</code>) JSB support. In a regular
          browser, the <code>enable-xr</code> div renders as a normal div;
          callbacks and state transitions remain testable.
        </p>

        <div className="mb-8 rounded-xl border border-yellow-900/60 bg-yellow-950/30 p-4 text-xs text-yellow-200">
          <div className="mb-1 font-semibold text-yellow-300">
            Visual whitelist only
          </div>
          The SpatialDiv animation API only accepts visual fields:{' '}
          <code className="text-cyan-300">transform.translate.x/y/z</code>,{' '}
          <code className="text-cyan-300">transform.rotate.x/y/z</code>,{' '}
          <code className="text-cyan-300">transform.scale.x/y/z</code>, and{' '}
          <code className="text-cyan-300">opacity</code>. Layout / spatial-size
          fields (<code>width</code>, <code>height</code>, <code>back</code>,{' '}
          <code>backOffset</code>, <code>depth</code>) are explicitly rejected.
        </div>

        <SpatialDivAnimationOverview />

        <section className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
          <h3 className="mb-2 font-medium text-gray-400">
            Manual verification checklist (visionOS)
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Entrance: card fades in from translate.z=-50 / opacity=0 to rest
              on mount.
            </li>
            <li>
              Scale expand: div grows from scale 0.6 to 1.0; reset restores
              original transform.
            </li>
            <li>
              Opacity: element fades from 1.0 to 0.2; pause freezes mid-fade;
              suppression test confirms native ignores CSS opacity changes.
            </li>
            <li>
              Combined: after 500ms delay, translate.y / scale / opacity animate
              simultaneously.
            </li>
            <li>
              Playback rate: 2× speed completes a 2s rotate.z + opacity
              animation in ~1s.
            </li>
            <li>
              3D Rotate: transform.rotate.x/y/z animate together; pause / resume
              / reset each behave correctly.
            </li>
            <li>
              Reverse loop: ping-pongs translate.x indefinitely; toggle pauses /
              resumes the same session.
            </li>
            <li>
              All lifecycle callbacks (onStart, onComplete, onReset, onError)
              appear in the log panel.
            </li>
            <li>
              <code>playState</code> transitions through{' '}
              <code>idle → running → paused → running → finished</code> as
              expected; reset returns to <code>idle</code>.
            </li>
            <li>
              Capability detection page reports{' '}
              <code>supports('useAnimation')</code> and per-kind tokens
              consistently with runtime expectation. Public hook name used by
              the pages is <code>useAnimation</code>.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
