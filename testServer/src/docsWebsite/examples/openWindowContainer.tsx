import { SpatialSession } from '@xrsdk/runtime'
import { showSample } from './sampleLoader'
import { Vec3 } from '@xrsdk/runtime'

function MySample(props: { session?: SpatialSession }) {
  return (
    <div>
      <div
        className="btn"
        onClick={async () => {
          if (props.session) {
            let session = props.session
            // CODESAMPLE_START
            // Create window container
            var wg = await session.createWindowContainer({ style: 'Plain' })

            // Create a root entity displaying a webpage
            var ent = await session!.createEntity()
            var i = await session!.createWindowComponent({
              windowContainer: wg,
            })
            await i.loadURL('http://google.com')
            await ent.setCoordinateSpace('Root')
            await ent.setComponent(i)

            // Add enitity the windowcontainer
            await wg.setRootEntity(ent)
            // CODESAMPLE_END
          }
        }}
      >
        Open Plain WindowContainer
      </div>

      <div
        className="btn"
        onClick={async () => {
          if (props.session) {
            let session = props.session

            var wg = await session.createWindowContainer({
              style: 'Volumetric',
            })
            var ent = await session!.createEntity()
            await ent.setCoordinateSpace('Root')
            var vc = await session.createViewComponent()
            await ent.setComponent(vc)

            var box = await session.createMeshResource({ shape: 'sphere' })
            var mat = await session.createPhysicallyBasedMaterialResource()
            await mat.update()
            var customModel = await session.createModelComponent()
            await customModel.setMaterials([mat])
            await customModel.setMesh(box)
            var e2 = await session.createEntity()
            e2.transform.scale = new Vec3(0.2, 0.2, 0.2)
            await e2.setComponent(customModel)

            await e2.setParent(ent)

            await wg.setRootEntity(ent)

            var curTime = Date.now()
            let loop = async () => {
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
        Open Volumetric WindowContainer
      </div>

      <div
        className="btn"
        onClick={async () => {
          if (props.session) {
            let session = props.session

            var wg = await session.getImmersiveWindowContainer()
            var ent = await session!.createEntity()
            await ent.setCoordinateSpace('Root')
            var vc = await session.createViewComponent()
            await ent.setComponent(vc)

            var box = await session.createMeshResource({ shape: 'sphere' })
            var mat = await session.createPhysicallyBasedMaterialResource()
            await mat.update()
            var customModel = await session.createModelComponent()
            await customModel.setMaterials([mat])
            await customModel.setMesh(box)
            var e2 = await session.createEntity()
            e2.transform.scale = new Vec3(0.2, 0.2, 0.2)
            await e2.setComponent(customModel)

            await e2.setParent(ent)

            await wg.setRootEntity(ent)

            await session.openImmersiveSpace()

            var curTime = Date.now()
            let loop = async () => {
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
        Open Immersive WindowContainer
      </div>
    </div>
  )
}
showSample(MySample)
