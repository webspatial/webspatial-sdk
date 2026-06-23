import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

func getCGFloat(_ val: Double?) -> CGFloat? {
    if let v = val {
        return CGFloat(v)
    } else {
        return nil
    }
}

@main
struct WebSpatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @State var app = SpatialApp.Instance

    func getDefaultSize() -> CGSize {
        return CGSize(
            width: app
                .getSceneOptions().defaultSize!.width,
            height: app
                .getSceneOptions().defaultSize!.height
        )
    }

    func getDefaultSize3D() -> Size3D {
        return Size3D(
            width: app
                .getSceneOptions().defaultSize!.width,
            height: app
                .getSceneOptions().defaultSize!.height,
            depth: app.getSceneOptions().defaultSize!.depth ?? 0
        )
    }

    func getSceneOrCreate(_ sceneID: String?, _ style: SpatialScene.WindowStyle) -> SpatialScene {
        if let sceneID, let spatialScene = SpatialApp.Instance.getScene(sceneID) {
            return spatialScene
        }

        logger.debug("Missing scene for WindowGroup data. Recreating scene.")
        return SpatialApp.Instance.createScene(
            startURL,
            style,
            .visible,
            app.getSceneOptions()
        )
    }

    func getSceneOrCreate(_ sceneID: String, _ style: SpatialScene.WindowStyle) -> SpatialScene {
        return getSceneOrCreate(Optional(sceneID), style)
    }

    var body: some Scene {
        WindowGroup(
            id: SpatialScene.WindowStyle.window.rawValue,
            for: String.self
        ) { $windowData in
            let spatialScene = getSceneOrCreate(windowData, .window)
            SpatialSceneView(spatialScene: spatialScene)
        }
        defaultValue: {
            let scene = SpatialApp.Instance.createScene(
                startURL,
                .window,
                .visible,
                app.getSceneOptions()
            )

            return scene.id
        }
        .windowStyle(.plain)
        .defaultSize(
            getDefaultSize()
        ).windowResizability(
            app.getSceneOptions().windowResizability!
        )

        WindowGroup(id: SpatialScene.WindowStyle.volume.rawValue, for: String.self) { $windowData in
            let spatialScene = getSceneOrCreate(windowData, .volume)
            SpatialSceneView(spatialScene: spatialScene)
                .frame(
                    minWidth: getCGFloat(
                        spatialScene.sceneConfig?.resizeRange?.minWidth
                    ),
                    maxWidth: getCGFloat(
                        spatialScene.sceneConfig?.resizeRange?.maxWidth
                    ),
                    minHeight: getCGFloat(
                        spatialScene.sceneConfig?.resizeRange?.minHeight
                    ),
                    maxHeight: getCGFloat(
                        spatialScene.sceneConfig?.resizeRange?.maxHeight
                    )
                )
        }
        defaultValue: {
            let scene = SpatialApp.Instance.createScene(
                startURL,
                .volume,
                .visible,
                app.getSceneOptions()
            )

            return scene.id
        }
        .windowStyle(.volumetric)
        .defaultSize(
            getDefaultSize3D(),
            in: .meters
        ).windowResizability(
            app.getSceneOptions().windowResizability!
        )
        .defaultWorldScaling(app.getSceneOptions().worldScaling)
        .volumeWorldAlignment(app.getSceneOptions().worldAlignment)

        WindowGroup(id: "loading", for: String.self) { _ in
            LoadingView()
        }
        .defaultSize(CGSize(width: 400, height: 400))
    }
}
