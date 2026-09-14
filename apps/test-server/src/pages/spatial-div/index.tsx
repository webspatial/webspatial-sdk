import { SpatialDivOverview } from './shared'

export default function SpatialDivPage() {
  return (
    <div className="min-h-full bg-[#07080c] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold">Spatial Div</h1>
        <p className="mb-2 max-w-3xl text-sm text-gray-400">
          Behavior lab for <code className="text-cyan-300">enable-xr</code>{' '}
          SpatialDiv. Every scenario renders the same fixture twice: plain DOM
          (CSS reference) on the left,{' '}
          <code className="text-cyan-300">enable-xr</code> on the right. Any
          visual or logged difference is a finding.
        </p>
        <p className="mb-8 max-w-3xl text-xs text-gray-500">
          Readouts sample the host DOM (<code>getBoundingClientRect</code>,{' '}
          <code>elementFromPoint</code>, observers, mount counts). Compare those
          against where the native surface actually draws. Best exercised in a
          WebSpatial runtime (visionOS); in a regular browser the right column
          is still a useful markup twin.
        </p>

        <SpatialDivOverview />

        <section className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
          <h3 className="mb-2 font-medium text-gray-400">Method</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Fixture rules live in <code>lab.css</code> so ancestor selectors,
              sticky, keyframes, and unregistered <code>--xr-*</code>{' '}
              transitions come from a real stylesheet.
            </li>
            <li>
              <code>--xr-back</code> / <code>--xr-depth</code> /{' '}
              <code>--xr-z-index</code> are passed unitless inline, matching
              other test-server pages.
            </li>
            <li>
              Styles / animation / overlays / lifecycle include deliberate
              provocations (runtime <code>&lt;style&gt;</code>, CSSOM{' '}
              <code>insertRule</code>, <code>adoptedStyleSheets</code>,{' '}
              <code>CSS.registerProperty(--xr-back)</code>, WAAPI / scroll
              timelines, shadow / iframe raw vs JSX portals, body-portaled
              floats from a trigger rect, <code>onSpatialContentReady</code>
              ). Those outcomes are results, not lab bugs.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
