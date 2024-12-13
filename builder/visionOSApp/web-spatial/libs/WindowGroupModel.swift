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

class WindowGroupModel {
    static let Instance = WindowGroupModel()

    private init() {}

    var wgSetting: WindowGroupPlainDefaultValues = .init(
        defaultSize: CGSize(width: 1080, height: 720),
        windowResizability: .automatic
    )

    func update(_ data: WindowGroupPlainDefaultValues) {
        if let newSize = data.defaultSize {
            wgSetting.defaultSize = newSize
        }
        if let newResizability = data.windowResizability {
            wgSetting.windowResizability = newResizability
        }
    }
}
