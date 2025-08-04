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

    @State var app = SpatialApp.Instance

    var body: some Scene {
        WindowGroup(id: "Plain", for: SceneData.self) { $windowData in
            SpatialSceneView(sceneId: windowData.sceneID)
        }
        defaultValue: {
            let scene = SpatialApp.Instance.createScene(
                startURL,
                "Plain",
                .success
            )
            scene.spatialWebViewModel.load()
            let windowData = SceneData(
                windowStyle: "Plain",
                sceneID: scene.id
            )

            return windowData
        }
        .windowStyle(.plain)
        .defaultSize(
            app.getPlainSceneOptions().defaultSize!
        ).windowResizability(
            app.getPlainSceneOptions().windowResizability!
        )

        WindowGroup(id: "loading") {
            LoadingView()
        }
    }
}
