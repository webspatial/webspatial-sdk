export default function SpatialDivAnimationPage() {
  return (
    <div className="min-h-full bg-[#0d0d0d] p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2 border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-bold">SpatialDiv Animation Archive</h1>
          <p className="text-sm text-gray-400">
            This route is historical reference only. The legacy `animation`-prop
            session path has been removed from the public surface.
          </p>
        </div>

        <section className="rounded-2xl border border-gray-800 bg-[#111] p-5 text-sm text-gray-300">
          <p className="leading-6">
            The old SpatialDiv session demo used to exercise the Plan A
            compatibility layer. That entrypoint is now retired. For the unified
            declarative motion API, use the Spatialized Motion pages under{' '}
            <code className="text-cyan-300">/spatial-div-motion</code>.
          </p>
          <p className="mt-4 leading-6 text-gray-400">
            Capability probes use the single released motion key:
            <code className="ml-1 text-cyan-300">
              supports(&apos;useAnimation&apos;)
            </code>
            .
          </p>
        </section>

        <section className="rounded-2xl border border-gray-800 bg-[#111] p-5 text-sm text-gray-300">
          <h2 className="mb-3 font-semibold text-gray-100">Historical notes</h2>
          <ul className="list-disc space-y-2 pl-5 text-gray-400">
            <li>
              Plan A&apos;s legacy `animation` prop path is no longer part of
              the target-state API.
            </li>
            <li>
              React, core, and visionOS now route 2D motion through the unified
              `xr-animation` / `AnimateSpatializedElementMotion` path.
            </li>
            <li>
              The archived legacy-session spec remains as reference material
              only.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
