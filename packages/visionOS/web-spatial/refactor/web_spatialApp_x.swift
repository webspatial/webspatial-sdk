
import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

@main
struct web_spatialApp_x: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State var app: SpatialAppX
    @State var wgm = WindowContainerMgr.Instance

    @Environment(\.scenePhase) private var scenePhase

    init() {
        app = SpatialAppX()
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: SceneData.self) { $windowData in
            // get scene
            let scene = SpatialAppX.getScene(
                windowData.sceneID
            )
            // render
            SpatialSceneXView().environment(scene)
        }
        defaultValue: {
            let scene = SpatialAppX.createScene(startURL)
            // the 1st scene always stays idle
            scene.spatialWebviewModel?.load()
            let windowData = SceneData(
                windowStyle: "Plain",
                sceneID: scene.id
            )

            return windowData
        }
        .windowStyle(.plain)
        .defaultSize(
            wgm.getValue().defaultSize!
        ).windowResizability(
            wgm.getValue().windowResizability!
        )

        WindowGroup(id: "loading") {
            LoadingView()
        }
    }
}
