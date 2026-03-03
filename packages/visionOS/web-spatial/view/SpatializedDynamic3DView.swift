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
                    // Convert local gesture coordinates into world (global) coordinates via RealityKit.
                    let globalLocation3D = entity.convert(position: SIMD3<Float>(Float(value.location3D.x), Float(value.location3D.y), Float(value.location3D.z)), to: nil)
                    let globalPoint3D = Point3D(x: Double(globalLocation3D.x), y: Double(globalLocation3D.y), z: Double(globalLocation3D.z))

                    spatialScene.sendWebMsg(entity.spatialId, WebSpatialTapGuestureEvent(detail: WebSpatialTapGuestureEventDetail(location3D: value.location3D, globalLocation3D: globalPoint3D)))
                } else {
                    if let spatialEntity = SpatialEntity.findNearestParent(entity: value.entity) {
                        // Convert using the hit entity's coordinate space, then forward to the nearest SpatialEntity.
                        let globalLocation3D = value.entity.convert(
                            position: SIMD3<Float>(Float(value.location3D.x), Float(value.location3D.y), Float(value.location3D.z)),
                            to: nil
                        )
                        let globalPoint3D = Point3D(x: Double(globalLocation3D.x), y: Double(globalLocation3D.y), z: Double(globalLocation3D.z))

                        spatialScene.sendWebMsg(spatialEntity.spatialId, WebSpatialTapGuestureEvent(detail: WebSpatialTapGuestureEventDetail(location3D: value.location3D, globalLocation3D: globalPoint3D)))
                    }
                }
            }
    }

    var rotate3dEvent: some Gesture {
        RotateGesture3D().targetedToAnyEntity().onChanged { value in
            // Always forward rotate gesture events to JS
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialRotateGuestureEvent(
                    detail: .init(
                        quaternion: Quaternion(
                            x: value.rotation.quaternion.imag.x,
                            y: value.rotation.quaternion.imag.y,
                            z: value.rotation.quaternion.imag.z,
                            w: value.rotation.quaternion.real
                        )
                    )
                )
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
        }.onEnded { value in
            // Always forward rotate end event to JS
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialRotateEndGuestureEvent()
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isRotate = false
        }
    }

    var magnifyEvent: some Gesture {
        MagnifyGesture().targetedToAnyEntity().onChanged { value in
            // Always forward magnify gesture events to JS
            if let entity = value.entity as? SpatialEntity {
                let detail = WebSpatialMagnifyGuestureEventDetail(magnification: value.magnification)
                let gestureEvent = WebSpatialMagnifyGuestureEvent(
                    detail: detail
                )
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
        }.onEnded { value in
            // Always forward magnify end event to JS
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialMagnifyEndGuestureEvent()
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
                    let globalStartLocation3D = value.entity.convert(
                        position: SIMD3<Float>(Float(value.startLocation3D.x), Float(value.startLocation3D.y), Float(value.startLocation3D.z)),
                        to: nil
                    )
                    let globalStartPoint3D = Point3D(x: Double(globalStartLocation3D.x), y: Double(globalStartLocation3D.y), z: Double(globalStartLocation3D.z))

                    let startEvent = WebSpatialDragStartGuestureEvent(
                        detail: .init(
                            startLocation3D: value.startLocation3D,
                            globalLocation3D: globalStartPoint3D
                        )
                    )
                    spatialScene.sendWebMsg(entity.spatialId, startEvent)
                    isDrag = true
                } else {
                    let gestureEvent = WebSpatialDragGuestureEvent(
                        detail: .init(translation3D: value.translation3D)
                    )
                    spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
                }
            }
        }.onEnded { value in
            // Always forward drag end event to JS
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialDragEndGuestureEvent()
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
