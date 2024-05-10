//
//  WindowGroupManager.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation

class WindowGroupContentDictionary: ObservableObject {
    @Published var webViews = [String: WebView]()
    @Published var x = false
    @Published var updateFrame = false
    @Published var openWindowData: WindowGroupData? = nil
    init() {}
}

class WindowGroupManager {
    var windowGroups = [String: WindowGroupContentDictionary]()
    
    func createWebView(windowGroup: String, windowId: String, url: URL)->WebView {
        if windowGroups[windowGroup] == nil {
            windowGroups[windowGroup] = WindowGroupContentDictionary()
        }
        
        if windowGroups[windowGroup]!.webViews[windowId] == nil {
            windowGroups[windowGroup]!.webViews[windowId] = WebView(url: url)
        }
        
        return windowGroups[windowGroup]!.webViews[windowId]!
    }
    
    func getWindowGroup(windowGroup: String)->WindowGroupContentDictionary {
        if windowGroups[windowGroup] == nil {
            windowGroups[windowGroup] = WindowGroupContentDictionary()
        }
        return windowGroups[windowGroup]!
    }
    
    func getWebView(windowGroup: String, windowId: String)->WebView? {
        if windowGroups[windowGroup] != nil {
            if windowGroups[windowGroup]!.webViews[windowId] != nil {
                return windowGroups[windowGroup]!.webViews[windowId]!
            }
        }
        return nil
    }
}
