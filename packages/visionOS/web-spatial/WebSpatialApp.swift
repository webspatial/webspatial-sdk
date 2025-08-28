import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

func getCGFloat(_ val:Double?) -> CGFloat? {
    if let v = val {
        return CGFloat(v)
    }else {
        return nil
    }
}

@main
struct WebSpatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    @State var app = SpatialApp.Instance
    
    func getDefaultSize() -> CGSize {
        let ans =  CGSize(
            width:app
                .getSceneOptions().defaultSize!.width,
            height: app
                .getSceneOptions().defaultSize!.height)

        return ans
    }
    
    func getDefaultSize3D() -> Size3D {
        let ans =  Size3D(
            width:app
                .getSceneOptions().defaultSize!.width,
            height: app
                .getSceneOptions().defaultSize!.height,
            depth: app.getSceneOptions().defaultSize!.depth ?? 0)

        return ans
    }

    var body: some Scene {
        WindowGroup(
            id: SpatialScene.WindowStyle.window.rawValue,
            for: String.self
        ) { $windowData in
            SpatialSceneView(sceneId: windowData)
                .frame(
                    minWidth: getCGFloat(
                        app.getSceneOptions().resizeRange?.minWidth),
                    maxWidth: getCGFloat(
                        app.getSceneOptions().resizeRange?.maxWidth),
                    minHeight: getCGFloat(
                        app.getSceneOptions().resizeRange?.minHeight),
                    maxHeight: getCGFloat(
                        app.getSceneOptions().resizeRange?.maxHeight)
                )
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
            SpatialSceneView(sceneId: windowData)
                .frame(
                    minWidth: getCGFloat(
                        app.getSceneOptions().resizeRange?.minWidth),
                    maxWidth: getCGFloat(
                        app.getSceneOptions().resizeRange?.maxWidth),
                    minHeight: getCGFloat(
                        app.getSceneOptions().resizeRange?.minHeight),
                    maxHeight: getCGFloat(
                        app.getSceneOptions().resizeRange?.maxHeight)
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
       

        WindowGroup(id: "loading", for: String.self) { $windowData in
            LoadingView()
        }
        .defaultSize(CGSize(width: 400, height: 400))
    }
}
