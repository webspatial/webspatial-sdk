//
//  WindowGroupManager.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import typealias RealityKit.Entity

// Use class wrap avoid publishing swiftUI state on a background thread
class EntityWrap {
    var entity: Entity?
}

struct ModelViewData {
    var url: URL
    var entity: EntityWrap = .init()
    var position: SIMD3<Float>
    var added = false
}

class WindowGroupContentDictionary: ObservableObject {
    @Published var webViews = [String: WebView]()
    @Published var models = [String: ModelViewData]()
    @Published var toggleImmersiveSpace = false
    @Published var updateFrame = false
    @Published var openWindowData: WindowGroupData? = nil

    @Published var resizing = false
    var rootEntity = Entity()
    init() {}
}

class WindowGroupManager {
    var windowGroups = [String: WindowGroupContentDictionary]()

    func createWebView(windowGroup: String, windowID: String, url: URL)->WebView {
        if windowGroups[windowGroup] == nil {
            windowGroups[windowGroup] = WindowGroupContentDictionary()
        }

        if windowGroups[windowGroup]!.webViews[windowID] == nil {
            windowGroups[windowGroup]!.webViews[windowID] = WebView(url: url)
            windowGroups[windowGroup]!.webViews[windowID]?.parent = windowGroups[windowGroup]!
        }

        return windowGroups[windowGroup]!.webViews[windowID]!
    }

    func destroyWebView(windowGroup: String, windowID: String)->Bool {
        if windowGroups[windowGroup] != nil {
            if windowGroups[windowGroup]?.webViews.removeValue(forKey: windowID) != nil {
                return true
            }
        }
        return false
    }

    func getWindowGroup(windowGroup: String)->WindowGroupContentDictionary {
        if windowGroups[windowGroup] == nil {
            windowGroups[windowGroup] = WindowGroupContentDictionary()
        }
        return windowGroups[windowGroup]!
    }

    func getWebView(windowGroup: String, windowID: String)->WebView? {
        if windowGroups[windowGroup] != nil {
            if windowGroups[windowGroup]!.webViews[windowID] != nil {
                return windowGroups[windowGroup]!.webViews[windowID]!
            }
        }
        return nil
    }
}
