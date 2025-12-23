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
        RotateGesture3D().targetedToAnyEntity().onChanged { value in
            // Always forward rotate gesture events to JS
            if let entity = value.entity as? SpatialEntity {
                if !isRotate {
                    let startEvent = WebSpatialRotateStartGuestureEvent(
                        detail: .init(
                            rotation: value.rotation,
                            startAnchor3D: value.startAnchor3D,
                            startLocation3D: value.startLocation3D
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, startEvent)
                    isRotate = true
                } else {
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
        }.onEnded { value in
            // Always forward rotate end event to JS
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialRotateEndGuestureEvent(
                    detail: .init(
                        rotation: value.rotation,
                        startAnchor3D: value.startAnchor3D,
                        startLocation3D: value.startLocation3D
                    )
                )
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isRotate = false
        }
    }

    var magnifyEvent: some Gesture {
        MagnifyGesture().targetedToAnyEntity().onChanged { value in
            // Always forward magnify gesture events to JS
            if let entity = value.entity as? SpatialEntity {
                if !isScale {
                    let startEvent = WebSpatialMagnifyStartGuestureEvent(
                        detail: .init(
                            magnification: value.magnification,
                            velocity: value.velocity,
                            startLocation3D: value.startLocation3D,
                            startAnchor3D: value.startAnchor3D
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, startEvent)
                    isScale = true
                } else {
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
        }.onEnded { value in
            // Always forward magnify end event to JS
            if let entity = value.entity as? SpatialEntity {
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
            isScale = false
        }
    }

    var dragEvent: some Gesture {
        DragGesture().targetedToAnyEntity().onChanged { value in
            // Always forward drag gesture events to JS
            if let entity = value.entity as? SpatialEntity {
                if !isDrag {
                    let startEvent = WebSpatialDragStartGuestureEvent(
                        detail: .init(
                            location3D: value.location3D,
                            startLocation3D: value.startLocation3D,
                            translation3D: value.translation3D,
                            predictedEndTranslation3D: value.predictedEndTranslation3D,
                            predictedEndLocation3D: value.predictedEndLocation3D,
                            velocity: value.velocity
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, startEvent)
                    isDrag = true
                } else {
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
        }.onEnded { value in
            // Always forward drag end event to JS
            if let entity = value.entity as? SpatialEntity {
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
            isDrag = false
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
