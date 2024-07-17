//
//  WindowGroupManager.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import RealityKit
import typealias RealityKit.Entity
import SwiftUI

// Use class wrap avoid publishing swiftUI state on a background thread
class EntityWrap {
    var entity: Entity?
}

class ModelUIComponent: WatchableObject {
    @Published var url: URL?
    @Published var aspectRatio: String = "fit"
    @Published var resolutionX: Double = 0
    @Published var resolutionY: Double = 0
}

class InputComponent: WatchableObject {
    weak var wv: SpatialWebView?
    var itc = InputTargetComponent()
    var resourceID = ""
    var isDragging = false
    var trackedPosition: SIMD3<Float> = .zero
}

class SpatialResource: WatchableObject, Component {
    // Always populated
    let id = UUID().uuidString
    var resourceType = "undefined"
    weak var mngr: WindowGroupManager?

    // populated based on type
    var meshResource: MeshResource?
    var physicallyBasedMaterial: PhysicallyBasedMaterial?
    var modelComponent: ModelComponent?
    @Published var modelUIComponent: ModelUIComponent?
    @Published var inputComponent: InputComponent?
    @Published var spatialWebView: SpatialWebView?
    @Published var forceUpdate = false

    // Entity
    let modelEntity = ModelEntity()

    // This resource will be destroyed if this webview is destroyed
    weak var ownerWebview: SpatialWebView?

    // Window group that this entity will be displayed in (not related to resource ownership)
    weak var parentWindowGroup: WindowGroupContentDictionary?

    func setParentWindowGroup(wg: WindowGroupContentDictionary?) {
        if let g = parentWindowGroup {
            g.childEntities.removeValue(forKey: id)
        }
        parentWindowGroup = wg
        if let g = parentWindowGroup {
            g.childEntities[id] = self
        }
    }

    init(resourceType: String, mngr: WindowGroupManager, windowGroupID: String, owner: SpatialWebView?) {
        self.mngr = mngr
        self.resourceType = resourceType
        self.ownerWebview = owner

        super.init()
        mngr.allResources[id] = self
    }

    func destroy()->Bool {
        var removed = false
        if resourceType == "Entity" {
            modelEntity.removeFromParent()
            if let wg = parentWindowGroup {
                if let _ = wg.childEntities.removeValue(forKey: id) {
                    removed = true
                }
            }
        }

        if let wv = ownerWebview {
            if let _ = wv.childResources.removeValue(forKey: id) {
                removed = true
            }
        }

        _ = mngr!.allResources.removeValue(forKey: id)
        return removed
    }
}

class SpatialComponent {
    var componentType = "undefined"
}

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
