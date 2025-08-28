import Foundation
import SwiftUI

let logger = Logger()

// To load a local path, remove http:// eg.  "static-web/"
let nativeAPIVersion = pwaManager.getVersion()

// start URL
let startURL = pwaManager.start_url

let DefaultPlainWindowContainerSize = CGSize(width: 1280, height: 720)

enum XLoadingMethod: String, Decodable, Encodable, Hashable {
    case show
    case hide
}

struct XLoadingViewData: Decodable, Hashable, Encodable {
    let sceneID: String
    let method: XLoadingMethod
    let windowStyle: String?
}

struct SceneOptions {
    var defaultSize: Size?
    var windowResizability: WindowResizability?
    var resizeRange: ResizeRange?
    var worldScaling: WorldScalingBehavior
    var worldAlignment: WorldAlignmentBehavior
    var baseplateVisibility: Visibility
}

struct Size: Codable {
    var width: Double
    var height: Double
    var depth: Double?
}


extension SceneOptions {
    init(_ options: XSceneOptionsJSB) {
        defaultSize = Size(
            width: options.defaultSize?.width ?? DefaultPlainWindowContainerSize.width,
            height: options.defaultSize?.height ?? DefaultPlainWindowContainerSize.height,
            depth: options.defaultSize?.depth ?? 0
        )
        windowResizability = decodeWindowResizability(nil)
        resizeRange = options.resizability
        /// volume only
        worldScaling = options.worldScaling?.toSDK ?? .automatic
        worldAlignment = options.worldAlignment?.toSDK ?? .automatic
        baseplateVisibility = options.baseplateVisibility?.toSDK ?? .automatic
    }
}

func decodeWindowResizability(_ windowResizability: String?) -> WindowResizability {
    switch windowResizability {
        case "automatic":
            return .automatic
        case "contentSize":
            return .contentSize
        case "contentMinSize":
            return .contentMinSize
        default:
            return .automatic
    }
}

@Observable
class SpatialApp {
    private var scenes = [String: SpatialScene]()
    
    // delegate properties to pwaManager
    var name: String { pwaManager.name }
    var scope: String { pwaManager.scope }
    var displayMode: PWADisplayMode { pwaManager.display }
    var version: String { pwaManager.getVersion() }
    var startURL: String { pwaManager.start_url }
    
    // used to cache scene config
    private var sceneOptions: SceneOptions


    static let Instance: SpatialApp = .init()

    init() {
        // init pwa manager
        pwaManager._init()

        Logger.initLogger()

        sceneOptions = SceneOptions(pwaManager.mainScene);
        
        print("plainSceneOptions",sceneOptions)
        
        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)
    }
    


    func createScene(_ url: String, _ style: SpatialScene.WindowStyle, _ state: SpatialScene.SceneStateKind, _ sceneOptions: SceneOptions? = nil) -> SpatialScene {
        let scene = SpatialScene(url, style, state, sceneOptions)
        scenes[scene.id] = scene
        scene
            .on(event: SpatialObject.Events.Destroyed.rawValue, listener: onSceneDestroyed)

        
        return scene
    }
    
    private func onSceneDestroyed(_ object: Any, _ data: Any) {
        let spatialObject = object as! SpatialObject
        spatialObject
            .off(event: SpatialObject.Events.Destroyed.rawValue, listener: onSceneDestroyed)
        
        scenes.removeValue(forKey: spatialObject.id)
    }

    func getScene(_ id: String) -> SpatialScene? {
        return scenes[id]
    }

    
    func getSceneOptions() -> SceneOptions {
        return sceneOptions
    }
    
    
    // used form window.open logic
    public func openWindowGroup(
        _ targetSpatialScene: SpatialScene,
        _ sceneData: SceneOptions
    ) {
        if let activeScene = firstActiveScene {
            // cache scene config
            sceneOptions = sceneData
                        
            DispatchQueue.main.async() {
                activeScene.openWindowData.send(targetSpatialScene.id)
            }

        }
    }
    
    public func closeWindowGroup(_ targetSpatialScene: SpatialScene) {
        if let activeScene = firstActiveScene {
            activeScene.closeWindowData
                .send(targetSpatialScene.id)
        }
    }
    
    // used form window.open logic with loading ui
    public func openLoadingUI(_ targetSpatialScene: SpatialScene,_ open: Bool) {
        let lwgdata = XLoadingViewData(
            sceneID: targetSpatialScene.id,
            method: open ? .show : .hide,
            windowStyle: nil
        )
        
        if let activeScene = firstActiveScene {
            activeScene.setLoadingWindowData.send(lwgdata)
        }
    }
    
    private var firstActiveScene: SpatialScene? {
        get {
            let activeKV = scenes.first() { kv in
                kv.value.state == .visible
            }
            return (activeKV?.value)
        }
    }
    
    public func focusScene(_ targetSpatialScene: SpatialScene) {
        // only work when fully visible
        if targetSpatialScene.state != .visible {
            return
        }

        if let activeScene = firstActiveScene {
            activeScene.openWindowData.send(targetSpatialScene.id)
        }
    }
}
