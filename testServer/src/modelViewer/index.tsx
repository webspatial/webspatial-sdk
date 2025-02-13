import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { getSession } from '@xrsdk/react'
import { SpatialHelper, SpatialModelComponent } from '@xrsdk/runtime/dist'

function App() {
  useEffect(() => {
    ;(async () => {
      // Get volume
      var rootEnt = await getSession()?.getCurrentWindowGroup().getRootEntity()!

      // Create platform
      var platform = await SpatialHelper.instance?.shape.createShapeEntity()!
      platform.transform.position.y = -0.499
      platform.transform.scale.x = 1.0
      platform.transform.scale.y = 0.001
      platform.transform.scale.z = 1.0
      var mat =
        await SpatialHelper.instance!.session.createPhysicallyBasedMaterialResource()
      mat.baseColor = { a: 1.0, r: 0.2, g: 0.4, b: 0.7 }
      await mat.update()
      await platform.getComponent(SpatialModelComponent)?.setMaterials([mat])
      await platform.updateTransform()
      platform.setParent(rootEnt)

      // Create model
      var box = await SpatialHelper.instance?.shape.createModelEntity(
        '/src/assets/FlightHelmet.usdz',
      )!
      var meshBox =
        await SpatialHelper.instance!.shape.wrapInBoundingBoxEntity(box)
      await meshBox.setParent(rootEnt)
    })()
  }, [])

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      hello world
    </div>
  )
}

// Initialize react
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
