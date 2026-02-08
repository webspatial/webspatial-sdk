import SwiftUI

// zIndex() have some bug, so use zOrderBias to simulate zIndex effect
let zOrderBias = 0.001

final class GestureFlags {
    var isDrag = false
}

struct SpatializedElementView<Content: View>: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    var parentScrollOffset: Vec2
    var content: Content

    @State private var gestureFlags = GestureFlags()

    init(parentScrollOffset: Vec2, @ViewBuilder content: () -> Content) {
        self.parentScrollOffset = parentScrollOffset
        self.content = content()
    }

    // Begin Interaction
    var gesture: some Gesture {
        DragGesture(minimumDistance: 10)
            .onChanged(onDragging)
            .onEnded(onDraggingEnded)
            .simultaneously(with:
                RotateGesture3D()
                    .onChanged(onRotateGesture3D)
                    .onEnded(onRotateGesture3DEnd)
            )
            .simultaneously(with:
                MagnifyGesture()
                    .onChanged(onMagnifyGesture)
                    .onEnded(onMagnifyGestureEnd)
            )
            .simultaneously(with:
                SpatialTapGesture(count: 1)
                    .onEnded(onTapEnded)
            )
    }

    private func onRotateGesture3D(_ event: RotateGesture3D.Value) {
        if spatializedElement.enableRotateGesture {
            let quaternion = event.rotation.quaternion
            let x = quaternion.imag.x
            let y = quaternion.imag.y
            let z = quaternion.imag.z
            let w = quaternion.real
            let detail = WebSpatialRotateGuestureEventDetail(quaternion: .init(x: x, y: y, z: z, w: w))

            let gestureEvent = WebSpatialRotateGuestureEvent(detail: detail)
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onRotateGesture3DEnd(_ event: RotateGesture3D.Value) {
        if spatializedElement.enableRotateEndGesture {
            spatialScene.sendWebMsg(spatializedElement.id, WebSpatialRotateEndGuestureEvent())
        }
    }

    private func onDragging(_ event: DragGesture.Value) {
        if spatializedElement.enableDragStartGesture, !gestureFlags.isDrag {
            let gestureEvent = WebSpatialDragStartGuestureEvent(detail: .init(
                startLocation3D: event.startLocation3D
            ))

            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }

        if spatializedElement.enableDragGesture {
            let gestureEvent = WebSpatialDragGuestureEvent(detail: .init(
                translation3D: event.translation3D
            ))

            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }

        gestureFlags.isDrag = true
    }

    private func onDraggingEnded(_ event: DragGesture.Value) {
        gestureFlags.isDrag = false
        if spatializedElement.enableDragEndGesture {
            let gestureEvent = WebSpatialDragEndGuestureEvent()
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onTapEnded(_ event: SpatialTapGesture.Value) {
        if spatializedElement.enableTapGesture {
            spatialScene.sendWebMsg(spatializedElement.id, WebSpatialTapGuestureEvent(detail: .init(location3D: event.location3D)))
        }
    }

    private func onMagnifyGesture(_ event: MagnifyGesture.Value) {
        if spatializedElement.enableMagnifyGesture {
            let gestureEvent = WebSpatialMagnifyGuestureEvent(
                detail: .init(
                    magnification: event.magnification
                ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onMagnifyGestureEnd(_ event: MagnifyGesture.Value) {
        if spatializedElement.enableMagnifyEndGesture {
            spatialScene.sendWebMsg(spatializedElement.id, WebSpatialMagnifyEndGuestureEvent())
        }
    }

    // End Interaction

    @ViewBuilder
    var body: some View {
        let transform = spatializedElement.transform
        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation!

        let width = spatializedElement.width
        let height = spatializedElement.height
        let depth = spatializedElement.depth
        let anchor = spatializedElement.rotationAnchor

        let centerX = spatializedElement.clientX - (spatializedElement.scrollWithParent ? parentScrollOffset.x : 0)
        let centerY = spatializedElement.clientY - (spatializedElement.scrollWithParent ? parentScrollOffset.y : 0)

        let opacity = spatializedElement.opacity
        let visible = spatializedElement.visible
        let enableGesture = spatializedElement.enableGesture

        let z = translation.z + (spatializedElement.zIndex * zOrderBias)
        let smallOffset = z == 0.0 ? 0.0001 : 0

        // when spatialdiv have regular/thick/thin material and alignment is back, there'll be a bug that clipping content
        // so when spatializedElement is spatialdiv, .center alignment will be applied
        let alignment = spatializedElement.defaultAlignment

        content
            .frame(width: width, height: height)
            .frame(depth: depth, alignment: alignment)
            .onGeometryChange3D(for: AffineTransform3D.self) { proxy in
                let rect3d = proxy.frame(in: .named("SpatialScene"))
                spatialScene.sendWebMsg(spatializedElement.id, SpatiaizedContainerClientCube(origin: rect3d.origin, size: rect3d.size))
                return proxy.transform(in: .named("SpatialScene"))!
            } action: { _, new in
                spatialScene.sendWebMsg(spatializedElement.id, SpatiaizedContainerTransform(detail: new))
            }
            .frame(depth: 0, alignment: .back)
            // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
            .offset(z: smallOffset)
            .scaleEffect(
                x: scale.width,
                y: scale.height,
                z: scale.depth,
                anchor: anchor
            )
            .rotation3DEffect(
                rotation,
                anchor: anchor
            )
            .offset(x: translation.x, y: translation.y)
            .offset(z: z)
            .position(x: centerX + width / 2, y: centerY + height / 2)
            .offset(z: spatializedElement.backOffset)
            .opacity(opacity)
            .hidden(!visible)
            .simultaneousGesture(enableGesture ? gesture : nil)
    }
}
