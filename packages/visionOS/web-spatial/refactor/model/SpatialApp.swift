import Foundation
import SwiftUI

enum XLoadingMethod: String, Decodable, Encodable, Hashable {
    case show
    case hide
}

struct XLoadingViewData: Decodable, Hashable, Encodable {
    let method: XLoadingMethod
    let windowStyle: String?
}

struct XPlainSceneOptions {
    var defaultSize: CGSize?
    var windowResizability: WindowResizability?
    var resizeRange: ResizeRange?
}

// support WindowContainerOptions => WindowContainerPlainDefaultValues
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

// incomming JSB data
struct XSceneOptionsJSB: Codable {
    // windowContainer
    let defaultSize: Size?
    struct Size: Codable {
        var width: Double
        var height: Double
    }
    
    let resizability: ResizeRange?
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
    private var map = [String: SpatialScene]()
    
    var name: String
    var scope: String
    var displayMode: PWADisplayMode
    var version: String
    var startURL: String

    static let Instance: SpatialApp = .init()

    init() {
        // init pwa manager
        pwaManager._init()
        name = pwaManager.name
        scope = pwaManager.scope
        displayMode = pwaManager.display
        version = pwaManager.getVersion()
        startURL = pwaManager.start_url

        Logger.initLogger()

        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)

        self.loadSceneOptionsFromPWAMainSceneCfg()
    }

    func createScene(_ url: String, _ style: String, _ state: SpatialScene.SceneStateKind) -> SpatialScene {
        let scene = SpatialScene(url, style, state)
        map[scene.id] = scene
        return scene
    }

    func getScene(_ id: String) -> SpatialScene? {
        return map[id]
    }

    // TODO: inspect scene
    
    private var plainSceneOptions: XPlainSceneOptions = .init(
        defaultSize: CGSize(width: 1080, height: 720 + (pwaManager.display != .fullscreen ? NavView.navHeight : 0)),
        windowResizability: .automatic,
        resizeRange: nil
    )
    
    func getPlainSceneOptions() -> XPlainSceneOptions {
        return plainSceneOptions
    }
    
    private func loadSceneOptionsFromPWAMainSceneCfg() {
        let cfg = XPlainSceneOptions(from: pwaManager.mainScene);
        setPlainSceneOptions(cfg)
    }
    
    func setPlainSceneOptions(_ data: XPlainSceneOptions) {
        if var newSize = data.defaultSize {
            newSize.height += (pwaManager.display != .fullscreen ? NavView.navHeight : 0)
            plainSceneOptions.defaultSize = newSize
        }
        if let newResizability = data.windowResizability {
            plainSceneOptions.windowResizability = newResizability
        }
        if let newResizeRange = data.resizeRange {
            plainSceneOptions.resizeRange = newResizeRange
        }
    }
}
