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

class WindowGroupContentDictionary: ObservableObject {
    // Resources
    @Published var childEntities = [String: SpatialResource]()
    // @Published var childResources = [String: SpatialResource]()

    // Global state
    @Published var toggleImmersiveSpace = false
    @Published var setSize = DefaultPlainWindowGroupSize
    @Published var updateFrame = false
    @Published var openWindowData: WindowGroupData? = nil
    @Published var closeWindowData: WindowGroupData? = nil
    @Published var hidden = false
    var rootEntity = Entity()
}

class WindowGroupManager {
    var allResources = [String: SpatialResource]()
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
