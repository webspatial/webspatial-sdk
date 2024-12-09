import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  var [supported, setSupported] = useState(false)
  useEffect(() => {
    ;(async () => {
      if (props.session) {
        let session = props.session
        // CODESAMPLE_START
        // Create an entity
        var entity = await session.createEntity()
        entity.transform.position.x = 500
        entity.transform.position.y = 300
        entity.transform.position.z = 100
        await entity.updateTransform()

        // Set coordinate space to dom so x/y/z is in pixel space relative to its parent
        await entity.setCoordinateSpace('Dom')

        // Create a window context we can display html within
        let pageWindow = await session.createWindowContext()
        var newDiv = document.createElement('div')
        newDiv.innerHTML = "<div style='color:red;'>Hello world</div>"
        pageWindow!.document.body.appendChild(newDiv)

        // Add window content to entity
        let wc = await session.createWindowComponent()
        await wc.setResolution(100, 100)
        await wc.setFromWindow(pageWindow!.window)
        await entity.setComponent(wc)

        // Add entity to the current page
        var rootWC = await session.getCurrentWindowComponent()
        var rootEntity = await rootWC.getEntity()
        await entity.setParent(rootEntity!)
        // CODESAMPLE_END
      }
    })()
  }, [])
  return <div></div>
}
showSample(MySample)
