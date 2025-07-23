import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

@main
struct WebSpatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @State private var appModel: SpatialScene

    init() {
//        appModel = SpatialScene("https://www.baidu.com/")
        appModel = SpatialScene("http://localhost:5173/")

        var spatialScene = appModel

        spatialScene.cornerRadius.bottomLeading = 130

        var spatialized2DElement: Spatialized2DElement = spatialScene.createSpatializedElement(type: .Spatialized2DElement)

        spatialized2DElement.transform.translation.x = 200
        spatialized2DElement.transform.translation.y = 200
        spatialized2DElement.transform.translation.z = 200
        spatialized2DElement.width = 200
        spatialized2DElement.height = 200
        spatialized2DElement.loadHtml()

        spatialScene.addChild(spatialized2DElement)
    }

    var body: some Scene {
        WindowGroup(id: "Plain") {
            SpatialSceneView().environment(appModel)
        }
    }
}
