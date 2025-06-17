import Combine
import SwiftUI
import UIKit

// TODO: maybe get input from pwa manifest
let defaultWindowContainerConfig = WindowContainerOptions(
    defaultSize: WindowContainerOptions.Size(
        width: DefaultPlainWindowContainerSize.width,
        height: DefaultPlainWindowContainerSize.height
    ),
    resizability: nil
)

struct WindowContainerData: Decodable, Hashable, Encodable {
    let windowStyle: String
    let windowContainerID: String
}

struct WindowContainerResizability: Decodable, Encodable {
    let resizeRange: ResizeRange?
}

enum LoadingMethod: String, Decodable, Encodable, Hashable {
    case show
    case hide
}

struct LoadingWindowContainerData: Decodable, Hashable, Encodable {
    let method: LoadingMethod
    let windowStyle: String?
}

struct WindowContainerPlainDefaultValues {
    var defaultSize: CGSize?
    var windowResizability: WindowResizability?
    var resizeRange: ResizeRange?
}

// support WindowContainerOptions => WindowContainerPlainDefaultValues
extension WindowContainerPlainDefaultValues {
    init(_ options: WindowContainerOptions) {
        defaultSize = CGSize(
            width: options.defaultSize?.width ?? DefaultPlainWindowContainerSize.width,
            height: options.defaultSize?.height ?? DefaultPlainWindowContainerSize.height
        )
        windowResizability = getWindowResizability(nil)
        resizeRange = options.resizability
    }
}

struct ResizeRange: Codable {
    var minWidth: Double?
    var minHeight: Double?
    var maxWidth: Double?
    var maxHeight: Double?
}

// incomming JSB data
struct WindowContainerOptions: Codable {
    // windowContainer
    let defaultSize: Size?
    struct Size: Codable {
        var width: Double
        var height: Double
    }

    let resizability: ResizeRange?
}

func getWindowResizability(_ windowResizability: String?) -> WindowResizability {
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
class WindowContainerMgr: ObservableObject {
    static let Instance = WindowContainerMgr()

    // cache for dynamic loading scene reopen
    var memorizedMainSceneConfig: WindowContainerPlainDefaultValues? = nil

    private init() {
        setToMainSceneCfg()
    }

    private var wgSetting: WindowContainerPlainDefaultValues = .init(
        defaultSize: CGSize(width: 1080, height: 720 + (pwaManager.display != .fullscreen ? NavView.navHeight : 0)),
        windowResizability: .automatic,
        resizeRange: nil
    )

    func getValue() -> WindowContainerPlainDefaultValues {
        return wgSetting
    }

    func setToMainSceneCfg() {
        if let cfg = memorizedMainSceneConfig != nil ? memorizedMainSceneConfig : WindowContainerPlainDefaultValues(pwaManager.mainScene) {
            updateWindowContainerPlainDefaultValues(cfg)
        }
    }

    func updateWindowContainerPlainDefaultValues(_ data: WindowContainerPlainDefaultValues) {
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
