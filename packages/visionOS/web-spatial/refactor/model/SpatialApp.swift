import Foundation
import SwiftUI

enum XLoadingMethod: String, Decodable, Encodable, Hashable {
    case show
    case hide
}

struct XLoadingWindowContainerData: Decodable, Hashable, Encodable {
    let method: XLoadingMethod
    let windowStyle: String?
}

struct XWindowContainerPlainDefaultValues {
    var defaultSize: CGSize?
    var windowResizability: WindowResizability?
    var resizeRange: ResizeRange?
}

// support WindowContainerOptions => WindowContainerPlainDefaultValues
extension XWindowContainerPlainDefaultValues {
    init(_ options: XWindowContainerOptions) {
        defaultSize = CGSize(
            width: options.defaultSize?.width ?? DefaultPlainWindowContainerSize.width,
            height: options.defaultSize?.height ?? DefaultPlainWindowContainerSize.height
        )
        windowResizability = XgetWindowResizability(nil)
        resizeRange = options.resizability
    }
}

// incomming JSB data
struct XWindowContainerOptions: Codable {
    // windowContainer
    let defaultSize: Size?
    struct Size: Codable {
        var width: Double
        var height: Double
    }
    
    let resizability: ResizeRange?
}

func XgetWindowResizability(_ windowResizability: String?) -> WindowResizability {
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
    // TODO: read only
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

//        setToMainSceneCfg()
    }

    func createScene(_ url: String, _ style: String, _ state: SpatialScene.SceneStateKind) -> SpatialScene {
        let newScene = SpatialSceneManager.Instance.create(
            url,
            style,
            state
        )

        return newScene
    }

    func getScene(_ name: String) -> SpatialScene? {
        return SpatialSceneManager.Instance.getScene(name)
    }

    // TODO: inspect scene
    
    private var wgSetting: XWindowContainerPlainDefaultValues = .init(
        defaultSize: CGSize(width: 1080, height: 720 + (pwaManager.display != .fullscreen ? NavView.navHeight : 0)),
        windowResizability: .automatic,
        resizeRange: nil
    )
    
    func getValue() -> XWindowContainerPlainDefaultValues {
        return wgSetting
    }
    
    func setToMainSceneCfg() {
        //        if let cfg = memorizedMainSceneConfig != nil ? memorizedMainSceneConfig : WindowContainerPlainDefaultValues(pwaManager.mainScene) {
        //            updateWindowContainerPlainDefaultValues(cfg)
        //        }
    }
    
    func updateWindowContainerPlainDefaultValues(_ data: XWindowContainerPlainDefaultValues) {
        if var newSize = data.defaultSize {
            newSize.height += (pwaManager.display != .fullscreen ? NavView.navHeight : 0)
            wgSetting.defaultSize = newSize
        }
        if let newResizability = data.windowResizability {
            wgSetting.windowResizability = newResizability
        }
        if let newResizeRange = data.resizeRange {
            wgSetting.resizeRange = newResizeRange
        }
    }
}
