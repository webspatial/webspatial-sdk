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
    }

    var body: some Scene {
        WindowGroup(id: "Plain") {
            SpatialSceneView().environment(appModel)
        }
    }
}
