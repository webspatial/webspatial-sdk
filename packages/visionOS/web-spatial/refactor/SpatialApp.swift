
import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

@main
struct SpatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State var initialLaunch = true

    @ObservedObject var wgm = WindowContainerMgr.Instance

    @Environment(\.scenePhase) private var scenePhase

    init() {
        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)

        // init global logger
        Logger.initLogger()

        // init pwa manager
        pwaManager._init()

        // create Immersive SpatialWindowContainer
//        let _ = SpatialWindowContainer.createImmersiveWindowContainer()

        // create first scene
        let wgd = SceneData(
            windowStyle: "Plain",
            sceneID: SpatialSceneX.getRootID()
        )
        // TODO:
        _ = SpatialSceneX(SpatialSceneX.getRootID(), startURL, wgd)
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
