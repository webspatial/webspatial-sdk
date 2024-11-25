import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  useEffect(() => {
    ;(async () => {
      if (props.session) {
        let session = props.session
        // CODESAMPLE_START
        // Setup initial contnet
        var modelEntity = await session.createEntity()
        modelEntity.transform.position.x = 0
        modelEntity.transform.position.y = 0
        modelEntity.transform.position.z = 0.05
        modelEntity.transform.scale = new DOMPoint(0.1, 0.1, 0.1)
        await modelEntity.updateTransform()
        var model = await session.createModelComponent({
          url: '/src/assets/FlightHelmet.usdz',
        })
        await modelEntity.setComponent(model)
        await modelEntity.setParentWindowGroup(
          await session.getCurrentWindowGroup(),
        )

        var dt = 0
        var curTime = Date.now()
        let loop = async () => {
          session.requestAnimationFrame(loop)
          dt = Date.now() - curTime
          curTime = Date.now()

          // Perform onFrame logic
          modelEntity.transform.position.x = Math.sin(curTime / 1000) * 0.2

          // Batch update events (will improve performance if multiple entities are used)
          await session.transaction(() => {
            modelEntity.updateTransform()
          })
        }
        loop()
        // CODESAMPLE_END
      }
    })()
  }, [])
  return <div></div>
}
showSample(MySample)
