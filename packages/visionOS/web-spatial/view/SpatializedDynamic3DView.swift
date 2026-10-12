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
    func webTarget(for hitEntity: Entity) -> SpatialEntity? {
        (hitEntity as? SpatialEntity) ?? SpatialEntity.findNearestParent(entity: hitEntity)
    }

    private func point3D(_ position: SIMD3<Float>) -> Point3D {
        Point3D(x: Double(position.x), y: Double(position.y), z: Double(position.z))
    }

    func targetLocalPoint(_ point: Point3D, converter: some RealityCoordinateSpaceConverting, target: SpatialEntity) -> Point3D {
        point3D(converter.convert(point, from: .local, to: target))
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
                let localPoint3D = targetLocalPoint(value.location3D, converter: value, target: target)
                let globalPoint3D = windowPixelPoint(value.convert(value.location3D, from: .local, to: .scene))

                spatialScene.sendWebMsg(target.spatialId, WebSpatialTapGuestureEvent(detail: WebSpatialTapGuestureEventDetail(location3D: localPoint3D, globalLocation3D: globalPoint3D)))
            }
    }

    var rotate3dEvent: some Gesture {
        makeRotateGesture3D().targetedToAnyEntity().onChanged { value in
            // Always forward rotate gesture events to JS
            if let entity = webTarget(for: value.entity) {
                let rotation = parentSpaceRotation(value.rotation, converter: value, target: entity)
                let gestureEvent = WebSpatialRotateGuestureEvent(
                    detail: .init(
                        quaternion: Quaternion(
                            x: Double(rotation.imag.x),
                            y: Double(rotation.imag.y),
                            z: Double(rotation.imag.z),
                            w: Double(rotation.real)
                        )
                    )
                )
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
        }.onEnded { value in
            // Always forward rotate end event to JS
            if let entity = webTarget(for: value.entity) {
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

    /// Cumulative drag translation in the target's parent space (meters). Falls
    /// back to Reality scene space when the entity has no parent. Computed from
    /// the same hit points as tap, not from SwiftUI's view-space translation3D.
    func parentSpaceTranslation(
        from startLocation: Point3D,
        to location: Point3D,
        converter: some RealityCoordinateSpaceConverting,
        target: SpatialEntity
    ) -> Vector3D {
        let start: SIMD3<Float>
        let now: SIMD3<Float>
        if let parent = target.parent {
            start = converter.convert(startLocation, from: .local, to: parent)
            now = converter.convert(location, from: .local, to: parent)
        } else {
            start = converter.convert(startLocation, from: .local, to: .scene)
            now = converter.convert(location, from: .local, to: .scene)
        }
        return Vector3D(
            x: Double(now.x - start.x),
            y: Double(now.y - start.y),
            z: Double(now.z - start.z)
        )
    }

    /// A cumulative rotation delta, not an absolute orientation. The conversion
    /// changes its axes into parent space, including SwiftUI's Y-down convention.
    private func orthogonalBasisPreservingReflection(of entity: Entity) -> simd_float3x3? {
        var hierarchy: [Entity] = []
        var current: Entity? = entity
        while let node = current {
            hierarchy.append(node)
            current = node.parent
        }

        var basis = matrix_identity_float3x3
        let epsilon: Float = 1e-6
        for node in hierarchy.reversed() {
            let scale = node.scale
            guard abs(scale.x) > epsilon, abs(scale.y) > epsilon, abs(scale.z) > epsilon else { return nil }
            let scaleSigns = SIMD3<Float>(
                scale.x < 0 ? -1 : 1,
                scale.y < 0 ? -1 : 1,
                scale.z < 0 ? -1 : 1
            )
            basis *= simd_float3x3(node.orientation)
            basis *= simd_float3x3(diagonal: scaleSigns)
        }
        return basis
    }

    func parentSpaceRotation(
        _ rotation: Rotation3D,
        converter: some RealityCoordinateSpaceConverting,
        target: SpatialEntity
    ) -> simd_quatf {
        let sceneRotation = converter.convert(rotation, from: .local, to: .scene)
        if let parent = target.parent {
            // Compose each hierarchy level from its local rotation and scale
            // signs. This retains handedness without allowing non-uniform scale
            // magnitudes to skew a descendant's logical axes.
            guard let parentBasis = orthogonalBasisPreservingReflection(of: parent) else {
                // Preserve the previous rotation-only behavior when a zero
                // scale axis makes the full parent basis non-invertible.
                let parentOrientation = parent.orientation(relativeTo: nil)
                return simd_normalize(parentOrientation.inverse * sceneRotation * parentOrientation)
            }
            let parentLocalRotation = parentBasis.transpose * simd_float3x3(sceneRotation) * parentBasis
            return simd_normalize(simd_quatf(parentLocalRotation))
        }
        return sceneRotation
    }

    var dragEvent: some Gesture {
        DragGesture().targetedToAnyEntity().onChanged { value in
            guard let target = webTarget(for: value.entity) else { return }
            if !isDrag {
                // Same conversion as tap: startLocation3D arrives in the RealityView's
                // SwiftUI space, not in entity meters or window pixels.
                let startPoint3D = targetLocalPoint(value.startLocation3D, converter: value, target: target)
                let globalStartPoint3D = windowPixelPoint(value.convert(value.startLocation3D, from: .local, to: .scene))

                let startEvent = WebSpatialDragStartGuestureEvent(
                    detail: .init(
                        startLocation3D: startPoint3D,
                        globalLocation3D: globalStartPoint3D
                    )
                )
                spatialScene.sendWebMsg(target.spatialId, startEvent)
                isDrag = true
            }
            let gestureEvent = WebSpatialDragGuestureEvent(
                detail: .init(translation3D: parentSpaceTranslation(
                    from: value.startLocation3D, to: value.location3D,
                    converter: value, target: target
                ))
            )
            spatialScene.sendWebMsg(target.spatialId, gestureEvent)
        }.onEnded { value in
            if let target = webTarget(for: value.entity) {
                spatialScene.sendWebMsg(target.spatialId, WebSpatialDragEndGuestureEvent())
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
