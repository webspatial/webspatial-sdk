import RealityKit
import SwiftUI

struct SpatializedDynamic3DView: View {
    let spatializedDynamic3DElement: SpatializedDynamic3DElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene
    @State private var isDrag = false
    @State private var isRotate = false
    @State private var isScale = false

    /// The web-facing SpatialEntity for a hit entity. The actual hit may be a child mesh
    /// inside a SpatialEntity subtree, in which case the event belongs to the nearest parent.
    private func webTarget(for hitEntity: Entity) -> SpatialEntity? {
        (hitEntity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: hitEntity)
    }

    private func point3D(_ position: SIMD3<Float>) -> Point3D {
        Point3D(x: Double(position.x), y: Double(position.y), z: Double(position.z))
    }

    /// Scene-space meters expressed as window-global pixels. This is the space SpatialDiv
    /// already reports for clientX/Y/Z, and the one `convertCoordinate` calls `window`.
    private func windowPixelPoint(_ scenePosition: SIMD3<Float>) -> Point3D? {
        guard let content = spatializedDynamic3DElement.getViewContent() else { return nil }
        return content.convert(point: scenePosition, from: .scene, to: .global)
    }

    var spatialTapEvent: some Gesture {
        SpatialTapGesture(count: 1).targetedToAnyEntity()
            .onEnded { value in
                guard let target = webTarget(for: value.entity) else { return }
                // value.location3D is in the RealityView's SwiftUI space, so it has to be converted
                // before it can stand for target-local meters (offsetX/Y/Z) or window pixels
                // (clientX/Y/Z). Both come from the same hit point.
                let localPoint3D = point3D(value.convert(value.location3D, from: .local, to: target))
                let globalPoint3D = windowPixelPoint(value.convert(value.location3D, from: .local, to: .scene))

                spatialScene.sendWebMsg(target.spatialId, WebSpatialTapGuestureEvent(detail: WebSpatialTapGuestureEventDetail(location3D: localPoint3D, globalLocation3D: globalPoint3D)))
            }
    }

    var rotate3dEvent: some Gesture {
        makeRotateGesture3D().targetedToAnyEntity().onChanged { value in
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

    private func makeRotateGesture3D() -> RotateGesture3D {
        guard let raw = spatializedDynamic3DElement.rotateConstrainedToAxis else {
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
                    // Same conversion as tap: startLocation3D arrives in the RealityView's
                    // SwiftUI space, not in entity meters or window pixels.
                    let startPoint3D = point3D(value.convert(value.startLocation3D, from: .local, to: entity))
                    let globalStartPoint3D = windowPixelPoint(value.convert(value.startLocation3D, from: .local, to: .scene))

                    let startEvent = WebSpatialDragStartGuestureEvent(
                        detail: .init(
                            startLocation3D: startPoint3D,
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
        RealityView(make: { content, attachments in
            let rootEntity = spatializedDynamic3DElement.getRoot()
            content.add(rootEntity)
            spatializedDynamic3DElement.setViewContent(content)

            // Add existing attachments on initial creation
            for (_, info) in spatialScene.attachmentManager.attachments {
                if let attachmentEntity = attachments.entity(for: info.id) {
                    attachmentEntity.position = info.position
                    attachmentEntity.orientation = attachmentOrientation(info.rotation)
                    attachmentEntity.scale = info.scale
                    if let parentEntity = findSpatialEntity(info.placementId) {
                        parentEntity.addChild(attachmentEntity)
                    } else {
                        rootEntity.addChild(attachmentEntity)
                    }
                }
            }
        }, update: { _, attachments in
            let rootEntity = spatializedDynamic3DElement.getRoot()
            // Update attachment positions and parenting
            for (_, info) in spatialScene.attachmentManager.attachments {
                if let attachmentEntity = attachments.entity(for: info.id) {
                    attachmentEntity.position = info.position
                    attachmentEntity.orientation = attachmentOrientation(info.rotation)
                    attachmentEntity.scale = info.scale
                    // Re-parent if not already under the correct parent
                    if let parentEntity = findSpatialEntity(info.placementId) {
                        if attachmentEntity.parent != parentEntity {
                            parentEntity.addChild(attachmentEntity)
                        }
                    } else {
                        // Parent entity might have been destroyed; fall back to root.
                        if attachmentEntity.parent != rootEntity {
                            rootEntity.addChild(attachmentEntity)
                        }
                    }
                }
            }
        }, attachments: {
            ForEach(Array(spatialScene.attachmentManager.attachments.values)) { info in
                Attachment(id: info.id) {
                    info.webViewModel.getView()
                        .materialWithBorderCorner(
                            info.backgroundMaterial,
                            info.cornerRadius,
                            spatialScene.windowStyle
                        )
                        .frame(
                            width: info.frameSize.width,
                            height: info.frameSize.height
                        )
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

    private func attachmentOrientation(_ rotation: SIMD3<Float>) -> simd_quatf {
        let degreesToRadians = Float.pi / 180
        let rx = simd_quatf(angle: rotation.x * degreesToRadians, axis: SIMD3<Float>(1, 0, 0))
        let ry = simd_quatf(angle: rotation.y * degreesToRadians, axis: SIMD3<Float>(0, 1, 0))
        let rz = simd_quatf(angle: rotation.z * degreesToRadians, axis: SIMD3<Float>(0, 0, 1))
        return rz * ry * rx
    }

    private func findSpatialEntity(_ spatialId: String) -> SpatialEntity? {
        // Look up the SpatialEntity from the SpatialScene's spatial object registry
        return spatialScene.findSpatialObject(spatialId)
    }
}
