import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

// @main
struct WebSpatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup(id: "Plain", for: String.self) { _ in
//            SpatialSceneView(sceneId: sceneId)
        }
        defaultValue: {
            let spatialScene = SpatialSceneManager.Instance.create("http://localhost:5173/src/jsapi-test/")
            spatialScene.cornerRadius.bottomLeading = 130
            let spatialized2DElement: Spatialized2DElement = spatialScene.createSpatializedElement(type: .Spatialized2DElement)
//            spatialized2DElement.transform.translation.x = 200
//            spatialized2DElement.transform.translation.y = 200
//            spatialized2DElement.transform.translation.z = 200
//            spatialized2DElement.width = 200
//            spatialized2DElement.height = 200
//            spatialized2DElement.loadHtml()
            spatialized2DElement.setParent(spatialScene)
            spatialized2DElement.destroy()
            return spatialScene.id
        }
    }
}
