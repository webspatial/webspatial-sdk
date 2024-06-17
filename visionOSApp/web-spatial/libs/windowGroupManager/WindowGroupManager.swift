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

class ModelUIComponent: WatchableObject {
    @Published var url: URL?
    @Published var aspectRatio: String = "fit"
    @Published var resolutionX: Double = 0
    @Published var resolutionY: Double = 0
}

class SpatialResource: WatchableObject {
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

        super.init()
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
    // Resources
    @Published var entities = [String: SpatialResource]()
    @Published var resources = [String: SpatialResource]()

    // Global state
    @Published var toggleImmersiveSpace = false
    @Published var updateFrame = false
    @Published var openWindowData: WindowGroupData? = nil
    @Published var hidden = false
    var rootEntity = Entity()
}

class WindowGroupManager {
    var windowGroups = [String: WindowGroupContentDictionary]()

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
