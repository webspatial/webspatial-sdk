import SwiftUI

// zIndex() have some bug, so use zOrderBias to simulate zIndex effect
let zOrderBias = 0.001

struct SpatializedElementView<Content: View>: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    var parentScrollOffset: Vec2
    var content: Content

    init(parentScrollOffset: Vec2, @ViewBuilder content: () -> Content) {
        self.parentScrollOffset = parentScrollOffset
        self.content = content()
    }

    // Begin Interaction
    var gesture: some Gesture {
        DragGesture()
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
        if spatializedElement.enableRotateGesture || spatializedElement.enableRotateStartGesture {
            let gestureEvent = WebSpatialRotateGuestureEvent(
                detail: .init(
                    rotation: event.rotation,
                    startAnchor3D: event.startAnchor3D,
                    startLocation3D: event.startLocation3D
                ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onRotateGesture3DEnd(_ event: RotateGesture3D.Value) {
        if spatializedElement.enableRotateEndGesture {
            let gestureEvent = WebSpatialRotateEndGuestureEvent(
                detail: .init(
                    rotation: event.rotation,
                    startAnchor3D: event.startAnchor3D,
                    startLocation3D: event.startLocation3D
                ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onDragging(_ event: DragGesture.Value) {
        if spatializedElement.enableDragStartGesture || spatializedElement.enableDragGesture {
            let gestureEvent = WebSpatialDragGuestureEvent(detail: .init(
                location3D: event.location3D,
                startLocation3D: event.startLocation3D,
                translation3D: event.translation3D,
                predictedEndTranslation3D: event.predictedEndTranslation3D,
                predictedEndLocation3D: event.predictedEndLocation3D,
                velocity: event.velocity
            ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onDraggingEnded(_ event: DragGesture.Value) {
        if spatializedElement.enableDragEndGesture {
            let gestureEvent = WebSpatialDragEndGuestureEvent(
                detail: .init(
                    location3D: event.location3D,
                    startLocation3D: event.startLocation3D,
                    translation3D: event.translation3D,
                    predictedEndTranslation3D: event.predictedEndTranslation3D,
                    predictedEndLocation3D: event.predictedEndLocation3D,
                    velocity: event.velocity
                ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onTapEnded(_ event: SpatialTapGesture.Value) {
        if spatializedElement.enableTapGesture {
            spatialScene.sendWebMsg(spatializedElement.id, WebSpatialTapGuestureEvent(detail: .init(location3D: event.location3D)))
        }
    }

    private func onMagnifyGesture(_ event: MagnifyGesture.Value) {
        if spatializedElement.enableMagnifyGesture || spatializedElement.enableMagnifyStartGesture {
            let gestureEvent = WebSpatialMagnifyGuestureEvent(
                detail: .init(
                    magnification: event.magnification,
                    velocity: event.velocity,
                    startLocation3D: event.startLocation3D,
                    startAnchor3D: event.startAnchor3D
                ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onMagnifyGestureEnd(_ event: MagnifyGesture.Value) {
        if spatializedElement.enableMagnifyEndGesture {
            let gestureEvent = WebSpatialMagnifyEndGuestureEvent(
                detail: .init(
                    magnification: event.magnification,
                    velocity: event.velocity,
                    startLocation3D: event.startLocation3D,
                    startAnchor3D: event.startAnchor3D
                ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    // End Interaction

    @ViewBuilder
    var body: some View {
        let transform = spatializedElement.transform
        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation!
        let x = spatializedElement.clientX + (spatializedElement.scrollWithParent ? ( translation.x - parentScrollOffset.x) : translation.x)
        let y = spatializedElement.clientY + (spatializedElement.scrollWithParent ? ( translation.y - parentScrollOffset.y) : translation.y)
        let z =  translation.z + spatializedElement.backOffset + (spatializedElement.zIndex * zOrderBias)
        let width = spatializedElement.width
        let height = spatializedElement.height
        let depth = spatializedElement.depth
        let anchor = spatializedElement.rotationAnchor

        let opacity = spatializedElement.opacity
        let visible = spatializedElement.visible
        let enableGesture = spatializedElement.enableGesture
        let clip = spatializedElement.clip

        content.simultaneousGesture(enableGesture ? gesture : nil)
            .frame(width: width, height: height)
            .frame(depth: depth, alignment: .back)
            .onGeometryChange3D(for: AffineTransform3D.self) { proxy in
                let rect3d = proxy.frame(in: .named("SpatialScene"))
                spatialScene.sendWebMsg(spatializedElement.id, SpatiaizedContainerClientCube(origin: rect3d.origin, size: rect3d.size))

                return proxy.transform(in: .named("SpatialScene"))!
            } action: { _, new in
                spatialScene.sendWebMsg(spatializedElement.id, SpatiaizedContainerTransform(detail: new))
            }.if(clip, transform: { view in
                view.clipped()
            })

            .frame(depth: 0, alignment: .back)
            //            .background(Color(hex: "#161616E5"))
            // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
//            .offset(z: 0.0001)
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
            .offset(x: x, y: y)
            .offset(z: z)
            .opacity(opacity)
            .hidden(!visible)
    }
}
