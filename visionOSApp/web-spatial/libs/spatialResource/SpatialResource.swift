//
//  SpatialResource.swift
//  web-spatial
//
//  Created by ByteDance on 8/19/24.
//

import Combine
import Foundation
import RealityKit
import typealias RealityKit.Entity
import SwiftUI

enum CoordinateSpaceMode {
    case
        APP,
        DOM,
        ROOT
}

/**
 * Resource created from JS. Can be an entity or object that is attached to an entity like a mesh
 */
class SpatialResource: Component {
    // Always populated
    let id = UUID().uuidString
    var resourceType = "undefined"

    // populated based on type
    var meshResource: MeshResource?
    var physicallyBasedMaterial: PhysicallyBasedMaterial?
    var modelComponent: ModelComponent?
    var modelUIComponent: ModelUIComponent?
    var inputComponent: InputComponent?
    var spatialWebView: SpatialWebView?
    var forceUpdate = false

    // Entity
    var coordinateSpace = CoordinateSpaceMode.APP
    let modelEntity = ModelEntity()
    // Entity can have a child/parent relationship
    var childEntities = [String: SpatialResource]()
    weak var parent: SpatialResource? = nil

    func addChild(child: SpatialResource) {
        child.setParent(parentEnt: self)
    }

    func setParent(parentEnt: SpatialResource?) {
        assert(parentEnt == nil || parentEnt?.resourceType == "Entity")
        assert(resourceType == "Entity")

        // Remove parent windowGroup
        parentWindowGroup?.childEntities.removeValue(forKey: id)

        // Remove from existing parent
        parent?.childEntities.removeValue(forKey: id)

        // Set new parent
        if let p = parentEnt {
            parent = p
            p.childEntities[id] = self
        }
    }

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
        self.resourceType = resourceType
        self.ownerWebview = owner

        wgManager.srActiveInstances += 1
        mngr.allResources[id] = self
    }

    func destroy() -> Bool {
        var removed = false
        if resourceType == "Entity" {
            modelEntity.removeFromParent()
            if let wg = parentWindowGroup {
                if let _ = wg.childEntities.removeValue(forKey: id) {
                    removed = true
                }
            }

            let keys = childEntities.map { $0.key }
            for k in keys {
                childEntities[k]!.setParent(parentEnt: nil)
            }
            childEntities = [String: SpatialResource]()
        }

        if let wv = ownerWebview {
            if let _ = wv.childResources.removeValue(forKey: id) {
                removed = true
            }
        }

        meshResource = nil
        physicallyBasedMaterial = nil
        modelComponent = nil
        modelUIComponent = nil
        inputComponent = nil
        spatialWebView = nil
        modelEntity.components.removeAll()
        _ = wgManager.allResources.removeValue(forKey: id)
        return removed
    }

    deinit {
        wgManager.srActiveInstances -= 1
    }
}

@Observable
class ModelUIComponent {
    var url: URL?
    var aspectRatio: String = "fit"
    var resolutionX: Double = 0
    var resolutionY: Double = 0

    var opacity = false

    //  animation related function and props
    //    var animationEaseFn: AnimationEaseStyle  = .easeInOut
    var animateSubject = PassthroughSubject<AnimationDescription, Never>()

    func triggerAnimation(_ animationDesc: AnimationDescription) {
        animateSubject.send(animationDesc)
    }

    // called by PlainWindowGroupView
    func onAnimation(_ animationDesc: AnimationDescription) {
        opacity = animationDesc.fadeOut
    }
}

@Observable
class InputComponent {
    weak var wv: SpatialWebView?
    var itc = InputTargetComponent()
    var resourceID = ""
    var isDragging = false
    var trackedPosition: SIMD3<Float> = .zero
}
