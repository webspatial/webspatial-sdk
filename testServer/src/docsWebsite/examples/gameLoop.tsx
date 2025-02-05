import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  useEffect(() => {
    ;(async () => {
      if (props.session) {
        let session = props.session

        // Setup initial contnet
        var entity = await session.createEntity()
        entity.transform.position.x = 500
        entity.transform.position.y = 300
        entity.transform.position.z = 100
        await entity.updateTransform()
        await entity.setCoordinateSpace('Dom')
        let pageWindow = await session.createWindowContext()
        var newDiv = document.createElement('div')
        newDiv.innerHTML = "<div style='color:red;'>Hello world</div>"
        pageWindow!.document.body.appendChild(newDiv)
        let wc = await session.createWindowComponent()
        await wc.setResolution(100, 100)
        await wc.setFromWindow(pageWindow!.window)
        await entity.setComponent(wc)
        var rootWC = await session.getCurrentWindowComponent()
        var rootEntity = await rootWC.getEntity()
        await entity.setParent(rootEntity!)

        // CODESAMPLE_START
        var dt = 0
        var curTime = Date.now()
        let loop = async () => {
          dt = Date.now() - curTime
          curTime = Date.now()
          // Perform onFrame logic
          entity.transform.position.x = 500 + Math.sin(curTime / 1000) * 100
          // Batch update events (will improve performance if multiple entities are used)
          await session.transaction(() => {
            entity.updateTransform()
          })
        }
        session.addOnEngineUpdateEventListener(loop)
        // CODESAMPLE_END
      }
    })()
  }, [])
  return <div style={{ height: '400px' }}></div>
}
showSample(MySample)
