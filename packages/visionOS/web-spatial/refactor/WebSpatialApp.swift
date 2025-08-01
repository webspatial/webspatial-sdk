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

    @State var wgm = WindowContainerMgr.Instance

    var body: some Scene {
        WindowGroup(id: "Plain", for: SceneData.self) { $windowData in
            SpatialSceneView(sceneId: windowData.sceneID)
        }
        defaultValue: {
            let startURL = "http://localhost:5173/src/jsapi-test/"
            let scene = SpatialSceneManager.Instance.create(startURL, "Plain", .success)
            let windowData = SceneData(
                windowStyle: "Plain",
                sceneID: scene.id
            )

            return windowData
        }
        .windowStyle(.plain)
//        .defaultSize(
//            wgm.getValue().defaultSize!
//        ).windowResizability(
//            wgm.getValue().windowResizability!
//        )

        WindowGroup(id: "loading") {
            LoadingView()
        }
    }
}
