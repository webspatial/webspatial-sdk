import {
  SpatialHelper,
  SpatialInputComponent,
  SpatialSession,
} from '@webspatial/core-sdk'
import { showSample } from './sampleLoader'
import { SpatialView } from '@webspatial/react-sdk'
import { Euler, Quaternion } from 'three'

function MySample(_props: { session?: SpatialSession }) {
  return (
    <div className="flex flex-col items-center w-full">
      <SpatialView
        className="w-52 h-52 bg-white bg-opacity-25 rounded-xl"
        onViewLoad={async viewEnt => {
          var session = await SpatialHelper.instance!.session

          // Load our model
          var loadedModel =
            await SpatialHelper.instance!.shape.createModelEntity(
              'https://raw.githubusercontent.com/immersive-web/model-element/main/examples/assets/FlightHelmet.usdz',
            )

          // Put within 1x1x1 box entity
          var boundingBox =
            await SpatialHelper.instance!.shape.wrapInBoundingBoxEntity(
              loadedModel,
            )

          // Make box smaller so corners dont get clipped when rotating
          boundingBox.transform.scale.x = 0.9
          boundingBox.transform.scale.y = 0.9
          boundingBox.transform.scale.z = 0.9
          await boundingBox.updateTransform()

          // Add invisible collision mesh to handle rotation input
          var meshRes = await session.createMeshResource({ shape: 'box' })
          var matRes = await session.createPhysicallyBasedMaterialResource()
          matRes.baseColor.a = 0.0
          await matRes.update()
          var mc = await session.createModelComponent()
          await mc.setMesh(meshRes)
          await mc.setMaterials([matRes])
          await boundingBox.setComponent(mc)

          // Add model to the scene
          boundingBox.setParent(viewEnt)

          // Rotate model on user interaction
          await boundingBox.setComponent(await session.createInputComponent())
          var eulerRot = new Euler(0, 0, 0)
          let q = new Quaternion()
          boundingBox.getComponent(SpatialInputComponent)!.onTranslate = t => {
            if (t.translate) {
              eulerRot.y += t.translate.x * 20.0
              eulerRot.x -= t.translate.y * 20.0
            }
            q.setFromEuler(eulerRot)
            boundingBox.transform.orientation.x = q.x
            boundingBox.transform.orientation.y = q.y
            boundingBox.transform.orientation.z = q.z
            boundingBox.transform.orientation.w = q.w
            boundingBox.updateTransform()
          }
        }}
      />
    </div>
  )
}
showSample(MySample)
