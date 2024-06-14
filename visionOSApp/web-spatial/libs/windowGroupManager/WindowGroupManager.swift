//
//  WindowGroupManager.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import RealityKit
import typealias RealityKit.Entity

// Use class wrap avoid publishing swiftUI state on a background thread
class EntityWrap {
    var entity: Entity?
}

class ModelUIComponent: ObservableObject {
    @Published var url: URL?
    @Published var aspectRatio: String = "fit"
    @Published var resolutionX: Double = 0
    @Published var resolutionY: Double = 0
}

class SpatialResource: ObservableObject {
    // Always populated
    let id = UUID().uuidString
    let windowGroupID: String
    var resourceType = "undefined"
    weak var mngr: WindowGroupManager?

    // populated based on type
    var meshResource: MeshResource?
    var physicallyBasedMaterial: PhysicallyBasedMaterial?
    var modelComponent: ModelComponent?
    @Published var modelUIComponent: ModelUIComponent?
    @Published var spatialWebView: SpatialWebView?
    @Published var forceUpdate = false

    // Entity
    let modelEntity = ModelEntity()

    init(resourceType: String, mngr: WindowGroupManager, windowGroupID: String) {
        self.windowGroupID = windowGroupID
        self.mngr = mngr
        let wg = mngr.getWindowGroup(windowGroup: windowGroupID)
        self.resourceType = resourceType

        if resourceType == "Entity" {
            if wg.entities[id] == nil {
                wg.entities[id] = self
            }
        }

        if wg.resources[id] == nil {
            wg.resources[id] = self
        }
    }

    func destroy()->Bool {
        let wg = mngr!.getWindowGroup(windowGroup: windowGroupID)
        if resourceType == "Entity" {
            modelEntity.removeFromParent()
            wg.resources.removeValue(forKey: id)
            if let _ = wg.entities.removeValue(forKey: id) {
                return true
            }
        } else {
            if let _ = wg.resources.removeValue(forKey: id) {
                return true
            }
        }
        return false
    }
}

class SpatialComponent {
    var componentType = "undefined"
}

class WindowGroupContentDictionary: ObservableObject {
    @Published var entities = [String: SpatialResource]()
    @Published var resources = [String: SpatialResource]()

    @Published var toggleImmersiveSpace = false
    @Published var updateFrame = false
    @Published var openWindowData: WindowGroupData? = nil

    @Published var hidden = false
    var rootEntity = Entity()
    init() {}
}

class WindowGroupManager {
    var windowGroups = [String: WindowGroupContentDictionary]()

//    func destroyWebView(windowGroup: String, windowID: String)->Bool {
//        if windowGroups[windowGroup] != nil {
//            if let _ = windowGroups[windowGroup]?.webViews.removeValue(forKey: windowID) {
    ////                print("-----------deinit attempt on webview")
//
//                //  Timer.scheduledTimer(withTimeInterval: 5.0, repeats: false) { _ in
//                // print("Timer fired!")
//
//                // Cleanup webview wrapper refs
//                // wv.webViewNative?.webViewRef = nil
//                // wv.loadRequestWV = nil
//
//                // Remove references to Coordinator so that it gets cleaned up by arc
    ////                wv.webViewNative!.webViewHolder.appleWebView?.configuration.userContentController.removeScriptMessageHandler(forName: "bridge")
    ////                wv.webViewNative!.webViewHolder.appleWebView!.uiDelegate = nil
    ////                wv.webViewNative!.webViewHolder.appleWebView!.navigationDelegate = nil
    ////                wv.webViewNative!.webViewHolder.appleWebView!.scrollView.delegate = nil
//                // Destory the apple webview (not needed)
//                // wv.webViewNative!.webViewHolder.appleWebView = nil
//
//                // Cleanup native webview ref which will destroy the apple webview
//                //    wv.webViewNative = nil
//
//                return true
//            }
//        }
//        return false
//    }

    func getWindowGroup(windowGroup: String)->WindowGroupContentDictionary {
        if windowGroups[windowGroup] == nil {
            windowGroups[windowGroup] = WindowGroupContentDictionary()
        }
        return windowGroups[windowGroup]!
    }

    func getWebView(windowGroup: String, windowID: String)->SpatialWebView? {
        if windowGroups[windowGroup] != nil {
            if windowGroups[windowGroup]!.entities[windowID] != nil {
                return windowGroups[windowGroup]!.entities[windowID]!.spatialWebView
            }
        }
        return nil
    }
}
