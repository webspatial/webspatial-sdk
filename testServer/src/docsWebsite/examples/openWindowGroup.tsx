import { SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  return (
    <div>
      <div
        className="btn"
        onClick={async () => {
          if (props.session) {
            let session = props.session
            // CODESAMPLE_START
            // Create window group
            var wg = await session.createWindowGroup('Plain')

            // Create a root entity displaying a webpage
            var ent = await session!.createEntity()
            var i = await session!.createWindowComponent(wg)
            await i.loadURL('http://google.com')
            await ent.setCoordinateSpace('Root')
            await ent.setComponent(i)

            // Add enitity the windowgroup
            await ent.setParentWindowGroup(wg)
            // CODESAMPLE_END
          }
        }}
      >
        Open Plain WindowGroup
      </div>

      <div
        className="btn"
        onClick={async () => {
          if (props.session) {
            let session = props.session

            var wg = await session.createWindowGroup('Volumetric')
            var ent = await session!.createEntity()
            await ent.setCoordinateSpace('Root')
            var vc = await session.createViewComponent()
            await ent.setComponent(vc)

            var box = await session.createMeshResource({ shape: 'sphere' })
            var mat = await session.createPhysicallyBasedMaterial()
            await mat.update()
            var customModel = await session.createModelComponent()
            await customModel.setMaterials([mat])
            await customModel.setMesh(box)
            var e2 = await session.createEntity()
            e2.transform.scale = new DOMPoint(0.2, 0.2, 0.2)
            await e2.setComponent(customModel)

            await e2.setParent(ent)

            await ent.setParentWindowGroup(wg)

            var dt = 0
            var curTime = Date.now()
            let loop = async () => {
              dt = Date.now() - curTime
              curTime = Date.now()
              // Perform onFrame logic
              e2.transform.position.x = 0 + Math.sin(curTime / 1000) * 0.3
              // Batch update events (will improve performance if multiple entities are used)
              await session.transaction(() => {
                e2.updateTransform()
              })
            }
            session.addOnEngineUpdateEventListener(loop)
          }
        }}
      >
        Open Volumetric WindowGroup
      </div>

      <div
        className="btn"
        onClick={async () => {
          if (props.session) {
            let session = props.session

            var wg = await session.getImmersiveWindowGroup()
            var ent = await session!.createEntity()
            await ent.setCoordinateSpace('Root')
            var vc = await session.createViewComponent()
            await ent.setComponent(vc)

            var box = await session.createMeshResource({ shape: 'sphere' })
            var mat = await session.createPhysicallyBasedMaterial()
            await mat.update()
            var customModel = await session.createModelComponent()
            await customModel.setMaterials([mat])
            await customModel.setMesh(box)
            var e2 = await session.createEntity()
            e2.transform.scale = new DOMPoint(0.2, 0.2, 0.2)
            await e2.setComponent(customModel)

            await e2.setParent(ent)

            await ent.setParentWindowGroup(wg)

            await session.openImmersiveSpace()
            var dt = 0
            var curTime = Date.now()
            let loop = async () => {
              dt = Date.now() - curTime
              curTime = Date.now()
              // Perform onFrame logic
              e2.transform.position.z = -4
              e2.transform.position.y = 1
              e2.transform.position.x = 0 + Math.sin(curTime / 1000) * 3
              // Batch update events (will improve performance if multiple entities are used)
              await session.transaction(() => {
                e2.updateTransform()
              })
            }
            session.addOnEngineUpdateEventListener(loop)
          }
        }}
      >
        Open Immersive WindowGroup
      </div>
    </div>
  )
}
showSample(MySample)
