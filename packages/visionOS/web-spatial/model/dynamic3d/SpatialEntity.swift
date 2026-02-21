import RealityKit
import SwiftUI

@Observable
class SpatialEntity: Entity, SpatialObjectProtocol {
    let spatialId: String

    private var _isDestroyed: Bool = false
    var isDestroyed: Bool {
        return _isDestroyed
    }

    var listeners: [String: [(_ object: Any, _ data: Any) -> Void]] = [:]

    private var _enableTap: Bool = false
    private var _enableRotate: Bool = false
    private var _enableRotateEnd: Bool = false
    private var _enableDrag: Bool = false
    private var _enableDragStart: Bool = false
    private var _enableDragEnd: Bool = false
    private var _enableMagnify: Bool = false
    private var _enableMagnifyEnd: Bool = false

    var rotation: simd_quatd = .init()
    var spatialChildren: [String: SpatialEntity] = [:]
    var spatialComponents: [String: SpatialComponent] = [:]

    var enableTap: Bool {
        return _enableTap
    }

    var enableRotate: Bool {
        return _enableRotate || _enableRotateEnd
    }

    var enableDrag: Bool {
        return _enableDrag || _enableDragStart || _enableDragEnd
    }

    var enableMagnify: Bool {
        return _enableMagnify || _enableMagnifyEnd
    }

    var enableRotateEnd: Bool {
        return _enableRotateEnd
    }

    var enableDragEnd: Bool {
        return _enableDragEnd
    }

    var enableMagnifyEnd: Bool {
        return _enableMagnifyEnd
    }

    var enableInteractive: Bool {
        return enableTap || enableRotate || enableDrag || enableMagnify
    }

    required init() {
        spatialId = UUID().uuidString
        super.init()
        SpatialObject.serialQueue.sync {
            SpatialObject.objects[spatialId] = self
        }
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }

    init(_ _name: String) {
        spatialId = UUID().uuidString
        super.init()
        name = _name
        SpatialObject.serialQueue.sync {
            SpatialObject.objects[spatialId] = self
        }
        SpatialObjectWeakRefManager.setWeakRef(spatialId, self)
    }

    func addChild(entity: SpatialEntity) {
        spatialChildren[entity.spatialId] = entity
        super.addChild(entity)
    }

    func removeChild(id: String) {
        if let entity = spatialChildren[id] {
            super.removeChild(entity)
            spatialChildren.removeValue(forKey: id)
        } else {
            print("no child found")
        }
    }

    func removeFromParent() {
        if let parent = parent as? SpatialEntity {
            parent.removeChild(self)
        }
    }

    func addComponent(_ comp: SpatialComponent) {
        spatialComponents[comp.type.rawValue] = comp
        comp.addToEntity(entity: self)
    }

    func removeComponent(_ comp: SpatialComponent) {
        if spatialComponents[comp.type.rawValue] != nil {
            comp.removeFromEntity(entity: self)
            spatialComponents.removeValue(forKey: comp.type.rawValue)
        }
    }

    func updateTransform(_ matrix: [String: Float]) {
        transform.matrix = float4x4([matrix["0"]!, matrix["1"]!, matrix["2"]!, matrix["3"]!], [matrix["4"]!, matrix["5"]!, matrix["6"]!, matrix["7"]!], [matrix["8"]!, matrix["9"]!, matrix["10"]!, matrix["11"]!], [matrix["12"]!, matrix["13"]!, matrix["14"]!, matrix["15"]!])
    }

    func updateGesture(_ type: String, _ isEable: Bool) {
        switch WebSpatialGestureType(rawValue: type) {
        case .spatialtap:
            _enableTap = isEable
        case .spatialrotate:
            _enableRotate = isEable
        case .spatialrotateend:
            _enableRotateEnd = isEable
        case .spatialdrag:
            _enableDrag = isEable
        case .spatialdragstart:
            _enableDragStart = isEable
        case .spatialdragend:
            _enableDragEnd = isEable
        case .spatialmagnify:
            _enableMagnify = isEable
        case .spatialmagnifyend:
            _enableMagnifyEnd = isEable
        default:
            return
        }

        if enableInteractive {
            if !components.has(InputTargetComponent.self) {
                components.set(InputTargetComponent())
            }
        } else {
            if components.has(InputTargetComponent.self) {
                components.remove(InputTargetComponent.self)
            }
        }
    }

    static func findNearestParent(entity: Entity) -> SpatialEntity? {
        if let parent = entity.parent as? SpatialEntity {
            return parent
        } else if entity.parent != nil {
            return findNearestParent(entity: entity.parent!)
        }
        return nil
    }

    func setRotation(_ rotation: simd_quatd) {
        self.rotation = rotation
        transform.rotation = simd_quatf(ix: Float(rotation.imag.x), iy: Float(rotation.imag.y), iz: Float(rotation.imag.z), r: Float(rotation.real))
    }

    // Encodable
    enum CodingKeys: String, CodingKey {
        case id, name, isDestroyed, children, components
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(spatialId, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(isDestroyed, forKey: .isDestroyed)
        try container.encode(spatialChildren, forKey: .children)
        try container.encode(spatialComponents, forKey: .components)
    }

    // Equatable
    static func == (lhs: SpatialEntity, rhs: SpatialEntity) -> Bool {
        return lhs.spatialId == rhs.spatialId
    }

    func destroy() {
        if _isDestroyed {
            return
        }
        emit(event: SpatialObject.Events.BeforeDestroyed.rawValue, data: ["object": self])
        onDestroy()
        _isDestroyed = true

        emit(event: SpatialObject.Events.Destroyed.rawValue, data: ["object": self])
        listeners = [:]
        SpatialObject.serialQueue.sync {
            SpatialObject.objects.removeValue(forKey: spatialId)
        }
    }

    func onDestroy() {
        if parent != nil {
            removeFromParent()
        }
        components.removeAll()
        for (id, child) in spatialChildren {
            child.destroy()
        }
        spatialChildren = [:]
        for (id, components) in spatialComponents {
            components.destroy()
        }
        spatialComponents = [:]
    }

    deinit {
        SpatialObjectWeakRefManager.removeWeakRef(spatialId)
    }
}
