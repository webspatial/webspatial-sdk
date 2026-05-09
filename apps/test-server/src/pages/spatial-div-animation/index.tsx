import { SpatialDivAnimationOverview } from './shared'

export default function SpatialDivAnimationPage() {
  return (
    <div className="min-h-full bg-[#0d0d0d] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold">SpatialDiv Animation (POC)</h1>
        <p className="mb-2 max-w-3xl text-sm text-gray-400">
          Test pages for SpatialDiv animation via{' '}
          <code className="text-cyan-300">useAnimation</code> +{' '}
          <code className="text-cyan-300">
            {'<div enable-xr animation={...}>'}
          </code>
          . The hook auto-dispatches to the SpatialDiv path based on{' '}
          <code>to</code> key set (opacity, width, height, depth, back).
        </p>
        <p className="mb-8 max-w-3xl text-xs text-gray-500">
          Requires the WebSpatial visionOS runtime with{' '}
          <code>AnimateSpatialized2DElement</code> JSB command support. In a
          regular browser, the <code>enable-xr</code> div renders as a normal
          div; callbacks and state transitions remain testable.
        </p>

        <SpatialDivAnimationOverview />

        <section className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
          <h3 className="mb-2 font-medium text-gray-400">
            Manual verification checklist (visionOS)
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Entrance: card fades in from back=-50/opacity=0 to rest position
              on mount.
            </li>
            <li>
              Size expand: div grows from 200×120 to 400×240; cancel restores
              original size.
            </li>
            <li>
              Opacity: element fades from 1.0 to 0.2; pause freezes mid-fade.
            </li>
            <li>
              Combined: after 500ms delay, width/height/opacity/depth animate
              simultaneously.
            </li>
            <li>Playback rate: 2× speed completes a 2s animation in ~1s.</li>
            <li>
              Suppression: during animation, DOM sync does not overwrite
              animated properties (no visual jumps).
            </li>
            <li>
              All lifecycle callbacks (onStart, onComplete, onCancel, onError)
              appear in the log panel.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
