//
//  SpatialEntity.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Combine
import Foundation
import RealityKit
import typealias RealityKit.Entity

enum CoordinateSpaceMode {
    case
        APP,
        DOM,
        ROOT
}

// temp use SpatialBridgeComponent,
//  will be replaced when modelEntity is removed from SpatialEntity
//  then SpatialEntity have have a BridgeEntity instead
class SpatialBridgeComponent: Component {
    let spatialEntity: SpatialEntity

    init(_ spatialEntity: SpatialEntity) {
        self.spatialEntity = spatialEntity
    }
}

// Entity
@Observable
class SpatialEntity: SpatialObject {
    var coordinateSpace = CoordinateSpaceMode.APP
    let modelEntity = ModelEntity()

    var forceUpdate = false

    override init() {
        super.init()
        modelEntity.components.set(SpatialBridgeComponent(self))
        modelEntity.model = ModelComponent(mesh: .generateBox(size: 0.0), materials: [])
    }

    // Entity can have a child/parent relationship
    var childEntities = [String: SpatialEntity]()
    weak var parent: SpatialEntity? = nil

    // Window group that this entity will be displayed in (not related to resource ownership)
    weak var parentWindowGroup: SpatialWindowGroup?
    public func setParentWindowGroup(wg: SpatialWindowGroup?) {
        if let g = parentWindowGroup {
            g.childEntities.removeValue(forKey: id)
        }
        parentWindowGroup = wg
        if let g = parentWindowGroup {
            g.childEntities[id] = self
        }
    }

    public func addChild(child: SpatialEntity) {
        child.setParent(parentEnt: self)
    }

    public func setParent(parentEnt: SpatialEntity?) {
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

    // components
    private var components: [SpatialComponent] = []

    public func addComponent(_ component: SpatialComponent) {
        // first check component type
        components.append(component)
        component.entity = self
        component.onAddToEntity()
    }

    public func removeComponent(_ component: SpatialComponent) {
        if let index = components.firstIndex(of: component) {
            components.remove(at: index)
            component.entity = nil
        }
    }

    public func getComponent<T: SpatialComponent>(_ type: T.Type) -> T? {
        for component in components {
            if let specificComponent = component as? T {
                return specificComponent
            }
        }
        return nil
    }

    override func onDestroy() {
        if let wg = parentWindowGroup {
            wg.childEntities.removeValue(forKey: id)
        }

        setParent(parentEnt: nil)
        let keys = childEntities.map { $0.key }
        for k in keys {
            childEntities[k]!.setParent(parentEnt: nil)
        }
        childEntities = [String: SpatialEntity]()

        modelEntity.removeFromParent()
        modelEntity.components.removeAll()
    }
}
