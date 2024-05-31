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
    @Published var webViews = [String: SpatialWebView]()
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

    func createWebView(windowGroup: String, windowID: String, url: URL)->SpatialWebView {
        if windowGroups[windowGroup] == nil {
            windowGroups[windowGroup] = WindowGroupContentDictionary()
        }

        if windowGroups[windowGroup]!.webViews[windowID] == nil {
            windowGroups[windowGroup]!.webViews[windowID] = SpatialWebView(url: url)
            windowGroups[windowGroup]!.webViews[windowID]?.parentWindowGroupId = windowGroup
        }

        return windowGroups[windowGroup]!.webViews[windowID]!
    }

    func destroyWebView(windowGroup: String, windowID: String)->Bool {
        if windowGroups[windowGroup] != nil {
            if let _ = windowGroups[windowGroup]?.webViews.removeValue(forKey: windowID) {
//                print("-----------deinit attempt on webview")

                //  Timer.scheduledTimer(withTimeInterval: 5.0, repeats: false) { _ in
                // print("Timer fired!")

                // Cleanup webview wrapper refs
                // wv.webViewNative?.webViewRef = nil
                // wv.loadRequestWV = nil

                // Remove references to Coordinator so that it gets cleaned up by arc
//                wv.webViewNative!.webViewHolder.appleWebView?.configuration.userContentController.removeScriptMessageHandler(forName: "bridge")
//                wv.webViewNative!.webViewHolder.appleWebView!.uiDelegate = nil
//                wv.webViewNative!.webViewHolder.appleWebView!.navigationDelegate = nil
//                wv.webViewNative!.webViewHolder.appleWebView!.scrollView.delegate = nil
                // Destory the apple webview (not needed)
                // wv.webViewNative!.webViewHolder.appleWebView = nil

                // Cleanup native webview ref which will destroy the apple webview
                //    wv.webViewNative = nil

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

    func getWebView(windowGroup: String, windowID: String)->SpatialWebView? {
        if windowGroups[windowGroup] != nil {
            if windowGroups[windowGroup]!.webViews[windowID] != nil {
                return windowGroups[windowGroup]!.webViews[windowID]!
            }
        }
        return nil
    }
}
