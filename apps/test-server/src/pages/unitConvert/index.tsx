import { enableDebugTool, useMetrics } from '@webspatial/react-sdk'
enableDebugTool()

export default function UnitConvertTest() {
  const { pointToPhysical, physicalToPoint } = useMetrics()

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-8">Unit Convert Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            scaled
          </h2>

          <pre className="text-xs bg-black/40 p-4 rounded-lg h-40 overflow-auto font-mono">
            physicalToPoint(1):{physicalToPoint(1)} <br />
            pointToPhysical(1):{pointToPhysical(1)}
          </pre>

          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            unscaled
          </h2>

          <pre className="text-xs bg-black/40 p-4 rounded-lg h-40 overflow-auto font-mono">
            physicalToPoint(1):
            {physicalToPoint(1, { worldScalingCompensation: 'unscaled' })}{' '}
            <br />
            pointToPhysical(1):
            {pointToPhysical(1, { worldScalingCompensation: 'unscaled' })}
          </pre>
          <button
            className="btn btn-primary"
            onClick={() => {
              ;(window as any).__webspatialsdk__ =
                (window as any).__webspatialsdk__ || {}
              ;(window as any).__webspatialsdk__.physicalMetrics = {
                meterToPtScaled: 1360,
                meterToPtUnscaled: 1500 + ((Math.random() * 100) >> 0),
              }
              window.dispatchEvent(new Event('WebSpatialPhysicalMetricsUpdate'))
            }}
          >
            trigger random update
          </button>
          {/* <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">
            Console
          </h2>
          <pre className="text-xs bg-black/40 p-4 rounded-lg h-40 overflow-auto font-mono">
            {logs}
          </pre> */}
        </section>
      </div>
    </div>
  )
}
