import RealityKit
import SwiftUI

struct SpatializedDynamic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene
    @State private var isDrag = false
    @State private var isRotate = false
    @State private var isScale = false

    private var spatializedDynamic3DElement: SpatializedDynamic3DElement {
        return spatializedElement as! SpatializedDynamic3DElement
    }

    var spatialTapEvent: some Gesture {
        SpatialTapGesture(count: 1).targetedToAnyEntity()
            .onEnded { value in
                if let entity = value.entity as? SpatialEntity {
                    spatialScene.sendWebMsg(entity.spatialId, WebSpatialTapGuestureEvent(detail: WebSpatialTapGuestureEventDetail(location3D: value.location3D)))
                } else {
                    if let spatialEntity = SpatialEntity.findNearestParent(entity: value.entity) {
                        spatialScene.sendWebMsg(spatialEntity.spatialId, WebSpatialTapGuestureEvent(detail: WebSpatialTapGuestureEventDetail(location3D: value.location3D)))
                    }
                }
            }
    }

    var rotate3dEvent: some Gesture {
        RotateGesture3D()
            .targetedToAnyEntity()
            .onChanged { value in
                let targetEntity: SpatialEntity? = (value.entity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: value.entity)
                if let entity = targetEntity, entity.enableRotate {
                    let gestureEvent = WebSpatialRotateGuestureEvent(
                        detail: .init(
                            rotation: value.rotation,
                            startAnchor3D: value.startAnchor3D,
                            startLocation3D: value.startLocation3D
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
                }
            }
            .onEnded { value in
                let targetEntity: SpatialEntity? = (value.entity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: value.entity)
                if let entity = targetEntity, entity.enableRotateEnd {
                    let gestureEvent = WebSpatialRotateEndGuestureEvent(
                        detail: .init(
                            rotation: value.rotation,
                            startAnchor3D: value.startAnchor3D,
                            startLocation3D: value.startLocation3D
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
                }
            }
    }

    var magnifyEvent: some Gesture {
        MagnifyGesture()
            .targetedToAnyEntity()
            .onChanged { value in
                let targetEntity: SpatialEntity? = (value.entity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: value.entity)
                if let entity = targetEntity, entity.enableMagnify {
                    let gestureEvent = WebSpatialMagnifyGuestureEvent(
                        detail: .init(
                            magnification: value.magnification,
                            velocity: value.velocity,
                            startLocation3D: value.startLocation3D,
                            startAnchor3D: value.startAnchor3D
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
                }
            }
            .onEnded { value in
                let targetEntity: SpatialEntity? = (value.entity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: value.entity)
                if let entity = targetEntity, entity.enableMagnifyEnd {
                    let gestureEvent = WebSpatialMagnifyEndGuestureEvent(
                        detail: .init(
                            magnification: value.magnification,
                            velocity: value.velocity,
                            startLocation3D: value.startLocation3D,
                            startAnchor3D: value.startAnchor3D
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
                }
            }
    }

    var dragEvent: some Gesture {
        DragGesture()
            .targetedToAnyEntity()
            .onChanged { value in
                let targetEntity: SpatialEntity? = (value.entity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: value.entity)
                if let entity = targetEntity, entity.enableDrag {
                    let gestureEvent = WebSpatialDragGuestureEvent(
                        detail: .init(
                            location3D: value.location3D,
                            startLocation3D: value.startLocation3D,
                            translation3D: value.translation3D,
                            predictedEndTranslation3D: value.predictedEndTranslation3D,
                            predictedEndLocation3D: value.predictedEndLocation3D,
                            velocity: value.velocity
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
                }
            }
            .onEnded { value in
                let targetEntity: SpatialEntity? = (value.entity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: value.entity)
                if let entity = targetEntity, entity.enableDragEnd {
                    let gestureEvent = WebSpatialDragEndGuestureEvent(
                        detail: .init(
                            location3D: value.location3D,
                            startLocation3D: value.startLocation3D,
                            translation3D: value.translation3D,
                            predictedEndTranslation3D: value.predictedEndTranslation3D,
                            predictedEndLocation3D: value.predictedEndLocation3D,
                            velocity: value.velocity
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
                }
            }
    }

    var body: some View {
        RealityView(make: { content in
            let rootEntity = spatializedDynamic3DElement.getRoot()
            content.add(rootEntity)
        })
        .simultaneousGesture(spatialTapEvent)
        .simultaneousGesture(rotate3dEvent)
        .simultaneousGesture(dragEvent)
        .simultaneousGesture(magnifyEvent)
    }
}
