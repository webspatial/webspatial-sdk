//
//  WindowContainerMgr.swift
//  web-spatial
//
//  Created by ByteDance on 2024/12/13.
//

//
//  WindowContainerModel.swift
//  web-spatial
//
//  Created by ByteDance on 2024/11/25.
//

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
}

// support WindowContainerOptions => WindowContainerPlainDefaultValues
extension WindowContainerPlainDefaultValues {
    init(_ options: WindowContainerOptions) {
        defaultSize = CGSize(
            width: options.defaultSize?.width ?? DefaultPlainWindowContainerSize.width,
            height: options.defaultSize?.height ?? DefaultPlainWindowContainerSize.height
        )
        windowResizability = getWindowResizability(options.resizability)
    }
}

// incomming JSB data
struct WindowContainerOptions: Codable {
    // windowContainer
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
class WindowContainerMgr: ObservableObject {
    static let Instance = WindowContainerMgr()

    private init() {
        setToMainSceneCfg()
    }

    private var wgSetting: WindowContainerPlainDefaultValues = .init(
        defaultSize: CGSize(width: 1080, height: 720),
        windowResizability: .automatic
    )

    func getValue() -> WindowContainerPlainDefaultValues {
        return wgSetting
    }

    func setToMainSceneCfg() {
        let cfg = WindowContainerPlainDefaultValues(pwaConfig.mainScene)
        updateWindowContainerPlainDefaultValues(cfg)
    }

    func updateWindowContainerPlainDefaultValues(_ data: WindowContainerPlainDefaultValues) {
        if let newSize = data.defaultSize {
            wgSetting.defaultSize = newSize
        }
        if let newResizability = data.windowResizability {
            wgSetting.windowResizability = newResizability
        }
    }
}
