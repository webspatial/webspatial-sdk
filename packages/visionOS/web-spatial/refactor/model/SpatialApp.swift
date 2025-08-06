import Foundation
import SwiftUI

enum XLoadingMethod: String, Decodable, Encodable, Hashable {
    case show
    case hide
}

struct XLoadingViewData: Decodable, Hashable, Encodable {
    let sceneID: String
    let method: XLoadingMethod
    let windowStyle: String?
}

struct XPlainSceneOptions {
    var defaultSize: CGSize?
    var windowResizability: WindowResizability?
    var resizeRange: ResizeRange?
}

extension XPlainSceneOptions {
    init(_ options: XSceneOptionsJSB) {
        defaultSize = CGSize(
            width: options.defaultSize?.width ?? DefaultPlainWindowContainerSize.width,
            height: options.defaultSize?.height ?? DefaultPlainWindowContainerSize.height
        )
        windowResizability = decodeWindowResizability(nil)
        resizeRange = options.resizability
    }
    init(from options: WindowContainerOptions) {
        defaultSize = CGSize(
            width: options.defaultSize?.width ?? DefaultPlainWindowContainerSize.width,
            height: options.defaultSize?.height ?? DefaultPlainWindowContainerSize.height
        )
        windowResizability = decodeWindowResizability(nil)
        resizeRange = options.resizability
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

class SpatialApp {
    private var scenes = [String: SpatialScene]()
    
    // delegate properties to pwaManager
    var name: String { pwaManager.name }
    var scope: String { pwaManager.scope }
    var displayMode: PWADisplayMode { pwaManager.display }
    var version: String { pwaManager.getVersion() }
    var startURL: String { pwaManager.start_url }
    
    // used to cache scene config
    private var plainSceneOptions: XPlainSceneOptions

    static let Instance: SpatialApp = .init()

    init() {
        // init pwa manager
        pwaManager._init()

        Logger.initLogger()

        plainSceneOptions = XPlainSceneOptions(from: pwaManager.mainScene);
        
        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)
    }

    func createScene(_ url: String, _ style: SpatialScene.WindowStyle, _ state: SpatialScene.SceneStateKind, _ sceneOptions: XPlainSceneOptions? = nil) -> SpatialScene {
        let scene = SpatialScene(url, style, state, sceneOptions)
        scenes[scene.id] = scene
        scene
            .on(event: SpatialObject.Events.Destroyed.rawValue, listener: onSceneDestroyed)
        
        // hack code, need to resolve later by @fukang
        DispatchQueue.main.async() {
//            scene.spatialWebViewModel.load()
        }
        
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

    
    func getPlainSceneOptions() -> XPlainSceneOptions {
        return plainSceneOptions
    }
    
    // used form window.open logic
    public func openWindowGroup(_ targetSpatialScene: SpatialScene, _ sceneData: XPlainSceneOptions, _ onSuccess: (() -> Void)? = nil) {
        if let activeScene = firstActiveScene {
            // cache scene config
            plainSceneOptions = sceneData
                        
            DispatchQueue.main.async() {
                print(" openWindowData.send \(targetSpatialScene.id)")
                activeScene.openWindowData.send(targetSpatialScene.id)
                onSuccess?()
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
        guard targetSpatialScene.state != .pending else {
            return
        }

        if let activeScene = firstActiveScene {
            DispatchQueue.main.async() {
                activeScene.openWindowData.send(targetSpatialScene.id)
            }
        }
    }
}
