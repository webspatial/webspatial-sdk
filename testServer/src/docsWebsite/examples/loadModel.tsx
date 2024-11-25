import { Spatial, SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'
import { TestHelper } from '../../jsApiTestPages/tests'

function MySample(props: { session?: SpatialSession }) {
  useEffect(() => {
    ;(async () => {
      if (props.session) {
        let session = props.session
        // CODESAMPLE_START
        // Create an entity
        var modelEntity = await session.createEntity()
        modelEntity.transform.position.x = 0
        modelEntity.transform.position.y = 0
        modelEntity.transform.position.z = 0.05
        modelEntity.transform.scale = new DOMPoint(0.1, 0.1, 0.1)
        await modelEntity.updateTransform()

        // Add model to entity
        var model = await session.createModelComponent({
          url: '/src/assets/FlightHelmet.usdz',
        })
        await modelEntity.setComponent(model)

        // Display entity in current window group
        // Not this will attach the entity to the window's volume, not the web page
        // To attach to a webpage use a SpatialView
        await modelEntity.setParentWindowGroup(
          await session.getCurrentWindowGroup(),
        )
        // CODESAMPLE_END
      }
    })()
  }, [])
  return <div></div>
}
showSample(MySample)
