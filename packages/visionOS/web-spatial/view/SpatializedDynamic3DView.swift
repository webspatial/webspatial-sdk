import RealityKit
import SwiftUI

struct SpatializedDynamic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene
    @State private var isDrag = false
    @State private var isRotate = false
    @State private var isScale = false

    private var element: SpatializedDynamic3DElement {
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
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialRotateEndGuestureEvent()
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isRotate = false
        }
    }

    var magnifyEvent: some Gesture {
        MagnifyGesture().targetedToAnyEntity().onChanged { value in
            if let entity = value.entity as? SpatialEntity {
                let detail = WebSpatialMagnifyGuestureEventDetail(magnification: value.magnification)
                let gestureEvent = WebSpatialMagnifyGuestureEvent(
                    detail: detail
                )
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
        }.onEnded { value in
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialMagnifyEndGuestureEvent()
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isScale = false
        }
    }

    var dragEvent: some Gesture {
        DragGesture().targetedToAnyEntity().onChanged { value in
            if let entity = value.entity as? SpatialEntity {
                if !isDrag {
                    let startEvent = WebSpatialDragStartGuestureEvent(
                        detail: .init(
                            startLocation3D: value.startLocation3D
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
            if let entity = value.entity as? SpatialEntity {
                let gestureEvent = WebSpatialDragEndGuestureEvent()
                spatialScene.sendWebMsg(entity.spatialId, gestureEvent)
            }
            isDrag = false
        }
    }

    var body: some View {
        RealityView { content, attachments in
            let rootEntity = element.getRoot()
            content.add(rootEntity)

            parentAttachments(content: content, attachments: attachments)
        } update: { content, attachments in
            print("[RealityView] update closure running")
            parentAttachments(content: content, attachments: attachments)
        } attachments: {
            ForEach(Array(spatialScene.attachmentManager.attachments.values), id: \.id) { info in
                Attachment(id: info.id) {
                    spatialScene.attachmentManager.getWebViewModel(for: info.id)?.getView()
                        .frame(width: info.size.width, height: info.size.height)
                }
            }
        }
        .simultaneousGesture(spatialTapEvent)
        .simultaneousGesture(rotate3dEvent)
        .simultaneousGesture(dragEvent)
        .simultaneousGesture(magnifyEvent)
        .onAppear {}
    }

    private func parentAttachments(content: RealityViewContent, attachments: RealityViewAttachments) {
        for (id, info) in spatialScene.attachmentManager.attachments {
            print("[RealityView] Processing attachment: \(id)")
            guard let attachmentEntity = attachments.entity(for: id) else {
                print("[RealityView] ❌ No attachment entity for id: \(id)")
                continue
            }
            print("[RealityView] ✓ Got attachment entity")

            if let parentEntity = findEntity(info.entityId) {
                print("[RealityView] ✓ Found parent entity")
                if attachmentEntity.parent == nil {
                    parentEntity.addChild(attachmentEntity)
                    print("[RealityView] ✓ Parented attachment to entity")
                }
                print("[Position] Applying offset: \(info.offset)")
                attachmentEntity.position = info.offset
                print("[Position] Attachment position after: \(attachmentEntity.position)")
            } else {
                print("[RealityView] ❌ Parent entity not found: \(info.entityId)")
            }
        }
    }

    private func findEntity(_ id: String) -> Entity? {
        print("[findEntity] Looking for: \(id)")
        print("[findEntity] Available keys: \(spatialScene.debugSpatialObjectKeys())")
        if let spatialEntity: SpatialEntity = spatialScene.findSpatialObject(id) {
            print("[findEntity] ✓ Found SpatialEntity")
            return spatialEntity
        }
        if id == element.getRoot().spatialId {
            return element.getRoot()
        }
        print("[findEntity] ❌ Not found")
        return nil
    }
}
