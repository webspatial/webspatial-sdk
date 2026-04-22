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

    private func resolveSpatialEntity(_ e: Entity) -> SpatialEntity? {
        (e as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: e)
    }

    var spatialTapEvent: some Gesture {
        SpatialTapGesture(count: 1).targetedToAnyEntity()
            .onEnded { value in
                guard let spatialEntity = resolveSpatialEntity(value.entity) else { return }
                let globalLocation3D = value.entity.convert(
                    position: SIMD3<Float>(Float(value.location3D.x), Float(value.location3D.y), Float(value.location3D.z)),
                    to: nil
                )
                let globalPoint3D = Point3D(x: Double(globalLocation3D.x), y: Double(globalLocation3D.y), z: Double(globalLocation3D.z))

                spatialScene.sendWebMsg(spatialEntity.spatialId, WebSpatialTapGuestureEvent(detail: WebSpatialTapGuestureEventDetail(location3D: value.location3D, globalLocation3D: globalPoint3D)))
            }
    }

    var rotate3dEvent: some Gesture {
        makeRotateGesture3D().targetedToAnyEntity().onChanged { value in
            // Always forward rotate gesture events to JS
            if let entity = resolveSpatialEntity(value.entity) {
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
            if let entity = resolveSpatialEntity(value.entity) {
                let gestureEvent = WebSpatialRotateEndGuestureEvent()
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isRotate = false
        }
    }

    private func makeRotateGesture3D() -> RotateGesture3D {
        guard let raw = spatializedElement.rotateConstrainedToAxis else {
            return RotateGesture3D()
        }
        let dx = Double(raw.x)
        let dy = Double(raw.y)
        let dz = Double(raw.z)
        let len = (dx * dx + dy * dy + dz * dz).squareRoot()
        if len < 1e-9 {
            return RotateGesture3D()
        }
        let axis = RotationAxis3D(x: dx / len, y: dy / len, z: dz / len)
        return RotateGesture3D(constrainedToAxis: axis)
    }

    var magnifyEvent: some Gesture {
        MagnifyGesture().targetedToAnyEntity().onChanged { value in
            // Always forward magnify gesture events to JS
            if let entity = resolveSpatialEntity(value.entity) {
                let detail = WebSpatialMagnifyGuestureEventDetail(magnification: value.magnification)
                let gestureEvent = WebSpatialMagnifyGuestureEvent(
                    detail: detail
                )
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
        }.onEnded { value in
            // Always forward magnify end event to JS
            if let entity = resolveSpatialEntity(value.entity) {
                let gestureEvent = WebSpatialMagnifyEndGuestureEvent()
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isScale = false
        }
    }

    var dragEvent: some Gesture {
        DragGesture().targetedToAnyEntity().onChanged { value in
            // Always forward drag gesture events to JS
            if let entity = resolveSpatialEntity(value.entity) {
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
            if let entity = resolveSpatialEntity(value.entity) {
                let gestureEvent = WebSpatialDragEndGuestureEvent()
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isDrag = false
        }
    }

    var body: some View {
        RealityView(make: { content, attachments in
            let rootEntity = spatializedDynamic3DElement.getRoot()
            content.add(rootEntity)
            spatializedDynamic3DElement.setViewContent(content)

            for (_, info) in spatialScene.attachmentManager.attachments {
                guard
                    let wrapper = spatialScene.findSpatialObject(info.id) as SpatialEntity?,
                    let autoEntity = attachments.entity(for: info.id),
                    autoEntity.parent !== wrapper
                else { continue }
                (wrapper as Entity).addChild(autoEntity)
            }
        }, update: { _, attachments in
            for (_, info) in spatialScene.attachmentManager.attachments {
                guard
                    let wrapper = spatialScene.findSpatialObject(info.id) as SpatialEntity?,
                    let autoEntity = attachments.entity(for: info.id),
                    autoEntity.parent !== wrapper
                else { continue }
                (wrapper as Entity).addChild(autoEntity)
            }
        }, attachments: {
            ForEach(Array(spatialScene.attachmentManager.attachments.values)) { info in
                Attachment(id: info.id) {
                    info.webViewModel.getView()
                        .frame(width: info.size.width, height: info.size.height)
                }
            }
        })
        .simultaneousGesture(spatialTapEvent)
        .simultaneousGesture(rotate3dEvent)
        .simultaneousGesture(dragEvent)
        .simultaneousGesture(magnifyEvent)
        .onDisappear {
            spatializedDynamic3DElement.setViewContent(nil)
        }
    }
}
