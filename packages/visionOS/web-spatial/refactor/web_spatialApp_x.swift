
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
    @State var app: SpatialApp
    @State var wgm = WindowContainerMgr.Instance

    @Environment(\.scenePhase) private var scenePhase

    init() {
        app = SpatialApp()
        app.createRootScene()
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: SceneData.self) { $windowData in
            let scene = SpatialSceneX.getOrCreateSpatialScene(
                windowData.sceneID,
                windowData
            )
            SpatialSceneXView().environment(scene)
        }
        defaultValue: {
            let windowData = SceneData(
                windowStyle: "Plain",
                sceneID: SpatialSceneX.getRootID()
            )

            return windowData
        }
        .windowStyle(.plain)
        .defaultSize(
            wgm.getValue().defaultSize!
        ).windowResizability(
            wgm.getValue().windowResizability!
        )
    }
}
