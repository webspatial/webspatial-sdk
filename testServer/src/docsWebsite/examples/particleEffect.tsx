import { SpatialHelper, SpatialSession } from '@webspatial/core-sdk'
import { useEffect } from 'react'
import { showSample } from './sampleLoader'
import { SpatialView } from '@webspatial/react-sdk'

function MySample(_props: { session?: SpatialSession }) {
  let animating = false
  useEffect(() => {}, [])
  return (
    <div className="h-32 flex items-center justify-center relative">
      <SpatialView
        className="absolute w-72 h-72 rounded-full"
        onViewLoad={async viewEnt => {
          var box =
            await SpatialHelper.instance?.shape.createShapeEntity('sphere')!
          box.transform.scale.x = 0
          box.transform.scale.y = 0
          box.transform.scale.z = 0
          await box.updateTransform()

          box?.setParent(viewEnt)
          SpatialHelper.instance?.session.addOnEngineUpdateEventListener(
            async time => {
              await SpatialHelper.instance?.session.transaction(() => {
                box!.transform.position.x = Math.sin(time / 100) * 0.3
                box?.updateTransform()

                if (animating) {
                  box.transform.scale.x += 0.007
                  box.transform.scale.y += 0.007
                  box.transform.scale.z += 0.007

                  if (box.transform.scale.x > 0.45) {
                    animating = false
                    box.transform.scale.x = 0
                    box.transform.scale.y = 0
                    box.transform.scale.z = 0
                  }
                  box.updateTransform()
                }
              })
            },
          )
        }}
      ></SpatialView>
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full relative"
        onClick={() => {
          animating = true
        }}
      >
        ❤️
      </button>
    </div>
  )
}
showSample(MySample)
