import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  useEffect(() => {
    ;(async () => {
      if (props.session) {
        let session = props.session
        // Create a spatial view entity to display model in
        var viewEnt = await session.createEntity()
        viewEnt.setCoordinateSpace('Dom') // Set coordinate space so its transform is relative to the webpage's pixels
        viewEnt.transform.position.x = 800
        viewEnt.transform.position.y = 300
        viewEnt.updateTransform()

        let viewComponent = await session.createViewComponent()
        viewComponent.setResolution(400, 400)
        await viewEnt.setComponent(viewComponent)
        var wc = await session.getCurrentWindowComponent()
        var ent = await wc.getEntity()
        await viewEnt.setParent(ent!)

        // CODESAMPLE_START
        // Create an entity
        var modelEntity = await session.createEntity()
        modelEntity.transform.position.x = 0
        modelEntity.transform.position.y = 0
        modelEntity.transform.position.z = -0.4 // Place at the back of the volume 1x1x1
        modelEntity.transform.scale = new DOMPoint(0.4, 0.4, 0.4)
        await modelEntity.updateTransform()

        // Add model to entity
        var model = await session.createModelComponent({
          url: '/src/assets/FlightHelmet.usdz',
        })
        await modelEntity.setComponent(model)

        // To attach to a spatial view
        await modelEntity.setParent(viewEnt)
        // CODESAMPLE_END
      }
    })()
  }, [])
  return <div></div>
}
showSample(MySample)
