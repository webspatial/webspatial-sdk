import { SpatialHelper, SpatialSession } from '@webspatial/core-sdk'
import { showSample } from './sampleLoader'
import { SpatialView } from '@webspatial/react-sdk'

function MySample(_props: { session?: SpatialSession }) {
  return (
    <div className="flex flex-col items-center w-full">
      <SpatialView
        className="w-52 h-52 bg-white bg-opacity-25 rounded-xl"
        onViewLoad={async viewEnt => {
          var box =
            await SpatialHelper.instance?.shape.createShapeEntity('sphere')
          box?.setParent(viewEnt)
          SpatialHelper.instance?.session.addOnEngineUpdateEventListener(
            async time => {
              await SpatialHelper.instance?.session.transaction(() => {
                box!.transform.position.x = Math.sin(time / 300) * 0.1
                box?.updateTransform()
              })
            },
          )
        }}
      />
    </div>
  )
}
showSample(MySample)
