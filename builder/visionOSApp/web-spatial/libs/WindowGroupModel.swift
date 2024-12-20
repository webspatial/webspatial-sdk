//
//  WindowGroupModel.swift
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

struct WindowGroupData: Decodable, Hashable, Encodable {
    let windowStyle: String
    let windowGroupID: String
}

struct WindowGroupPlainDefaultValues {
    var defaultSize: CGSize?
    var windowResizability: WindowResizability?
}

// support WindowGroupOptions => WindowGroupPlainDefaultValues
extension WindowGroupPlainDefaultValues {
    init?(_ options: WindowGroupOptions) {
        guard let defaultSize = options.defaultSize else { return nil }
        self.defaultSize = CGSize(width: defaultSize.width, height: defaultSize.height)
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
class WindowGroupModel: ObservableObject {
    static let Instance = WindowGroupModel()

    private init() {
        if let cfg = WindowGroupPlainDefaultValues(mainSceneConfig) {
            update(cfg)
        }
    }

    private var wgSetting: WindowGroupPlainDefaultValues = .init(
        defaultSize: CGSize(width: 1080, height: 720),
        windowResizability: .automatic
    )

    func getValue() -> WindowGroupPlainDefaultValues {
        return wgSetting
    }

    func update(_ data: WindowGroupPlainDefaultValues) {
        if let newSize = data.defaultSize {
            wgSetting.defaultSize = newSize
        }
        if let newResizability = data.windowResizability {
            wgSetting.windowResizability = newResizability
        }
    }
}
