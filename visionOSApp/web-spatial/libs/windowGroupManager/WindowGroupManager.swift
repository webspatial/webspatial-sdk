//
//  WindowGroupManager.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Combine
import Foundation
import RealityKit
import typealias RealityKit.Entity
import SwiftUI

let DefaultPlainWindowGroupSize = CGSize(width: 1280, height: 720)

@Observable
class WindowGroupContentDictionary {
    // Resources
    var childEntities = [String: SpatialResource]()
    // var childResources = [String: SpatialResource]()

    // Global state
    var toggleImmersiveSpace = PassthroughSubject<Bool, Never>()

    var setSize = PassthroughSubject<CGSize, Never>()

    var updateFrame = false
    var openWindowData = PassthroughSubject<WindowGroupData, Never>()
    var closeWindowData = PassthroughSubject<WindowGroupData, Never>()
//    var hidden = false

    var rootEntity = Entity()
}

class WindowGroupManager {
    var allResources = [String: SpatialResource]()
    var srActiveInstances = 0
    var wvActiveInstances = 0
    var windowGroups = [String: WindowGroupContentDictionary]()

    func getWindowGroup(windowGroup: String)->WindowGroupContentDictionary {
        if windowGroups[windowGroup] == nil {
            windowGroups[windowGroup] = WindowGroupContentDictionary()
        }
        return windowGroups[windowGroup]!
    }

    func getWebView(windowGroup: String, windowID: String)->SpatialWebView? {
        if windowGroups[windowGroup] != nil {
            if windowGroups[windowGroup]!.childEntities[windowID] != nil {
                return windowGroups[windowGroup]!.childEntities[windowID]!.spatialWebView
            }
        }
        return nil
    }
}
