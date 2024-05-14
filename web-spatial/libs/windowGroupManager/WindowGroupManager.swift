//
//  WindowGroupManager.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation

struct ModelViewData {
    var url: URL
    var position: SIMD3<Float>
}

class WindowGroupContentDictionary: ObservableObject {
    @Published var webViews = [String: WebView]()
    @Published var models = [String: ModelViewData]()
    @Published var x = false
    @Published var updateFrame = false
    @Published var openWindowData: WindowGroupData? = nil
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
        }

        return windowGroups[windowGroup]!.webViews[windowID]!
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
