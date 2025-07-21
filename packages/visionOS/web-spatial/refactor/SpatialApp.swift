
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
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowContainerData.self) { $windowData in
            let scene = SpatialScene.getOrCreateSpatialScene(
                windowData.windowContainerID,
                windowData
            )
            // init root scene's url
            if windowData.windowContainerID == SpatialScene.getRootID() {
                let _ = scene!.url = startURL
            }
            SpatialSceneView().environment(scene)
        }
        defaultValue: {
            let windowData = WindowContainerData(
                windowStyle: "Plain",
                windowContainerID: SpatialScene.getRootID()
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
