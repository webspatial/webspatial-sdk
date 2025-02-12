//
//  WindowGroupMgr.swift
//  web-spatial
//
//  Created by ByteDance on 2024/12/13.
//

//
//  WindowGroupModel.swift
//  web-spatial
//
//  Created by ByteDance on 2024/11/25.
//

import Combine
import SwiftUI
import UIKit

// TODO: maybe get input from pwa manifest
let defaultWindowGroupConfig = WindowGroupOptions(
    defaultSize: WindowGroupOptions.Size(
        width: DefaultPlainWindowGroupSize.width,
        height: DefaultPlainWindowGroupSize.height
    ),
    resizability: nil
)

struct WindowGroupData: Decodable, Hashable, Encodable {
    let windowStyle: String
    let windowGroupID: String
}

enum LoadingMethod: String, Decodable, Encodable, Hashable {
    case show
    case hide
}

struct LoadingWindowGroupData: Decodable, Hashable, Encodable {
    let method: LoadingMethod
    let windowStyle: String?
}

struct WindowGroupPlainDefaultValues {
    var defaultSize: CGSize?
    var windowResizability: WindowResizability?
}

// support WindowGroupOptions => WindowGroupPlainDefaultValues
extension WindowGroupPlainDefaultValues {
    init(_ options: WindowGroupOptions) {
        defaultSize = CGSize(
            width: options.defaultSize?.width ?? DefaultPlainWindowGroupSize.width,
            height: options.defaultSize?.height ?? DefaultPlainWindowGroupSize.height
        )
        windowResizability = getWindowResizability(options.resizability)
    }
}

// incomming JSB data
struct WindowGroupOptions: Codable {
    // windowGroup
    let defaultSize: Size?
    let resizability: String?
    struct Size: Codable {
        var width: Double
        var height: Double
    }
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
class WindowGroupMgr: ObservableObject {
    static let Instance = WindowGroupMgr()

    private init() {
        setToMainSceneCfg()
    }

    private var wgSetting: WindowGroupPlainDefaultValues = .init(
        defaultSize: CGSize(width: 1080, height: 720),
        windowResizability: .automatic
    )

    func getValue() -> WindowGroupPlainDefaultValues {
        return wgSetting
    }

    func setToMainSceneCfg() {
        let cfg = WindowGroupPlainDefaultValues(pwaConfig.mainScene)
        updateWindowGroupPlainDefaultValues(cfg)
    }

    func updateWindowGroupPlainDefaultValues(_ data: WindowGroupPlainDefaultValues) {
        if let newSize = data.defaultSize {
            wgSetting.defaultSize = newSize
        }
        if let newResizability = data.windowResizability {
            wgSetting.windowResizability = newResizability
        }
    }
}
