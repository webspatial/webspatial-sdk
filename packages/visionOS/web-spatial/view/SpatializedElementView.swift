import CoreGraphics
import SwiftUI

final class GestureState {
    var isDrag = false
}

struct SpatializedElementView<Content: View>: View {
    let spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    var parentScrollOffset: Vec2
    var content: Content

    @State private var gestureState = GestureState()

    init(parentScrollOffset: Vec2, spatializedElement: SpatializedElement, @ViewBuilder content: () -> Content) {
        self.parentScrollOffset = parentScrollOffset
        self.spatializedElement = spatializedElement
        self.content = content()
    }

    /// Begin Interaction
    var gesture: some Gesture {
        DragGesture(minimumDistance: 10, coordinateSpace: .named("SpatialScene"))
            .onChanged(onDragging)
            .onEnded(onDraggingEnded)
            .simultaneously(with:
                makeRotateGesture3D()
                    .onChanged(onRotateGesture3D)
                    .onEnded(onRotateGesture3DEnd))
            .simultaneously(with:
                MagnifyGesture()
                    .onChanged(onMagnifyGesture)
                    .onEnded(onMagnifyGestureEnd))
            .simultaneously(with:
                SpatialTapGesture(count: 1, coordinateSpace: .named("SpatialScene"))
                    .onEnded(onTapEnded))
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
        if !gestureState.isDrag {
            spatialScene.isSpatialElementGestureActive = true
        }

        if spatializedElement.enableDragStartGesture, !gestureState.isDrag {
            let startLocal = sceneToLocal(event.startLocation3D)
            let globalPoint3D = event.startLocation3D
            let gestureEvent = WebSpatialDragStartGuestureEvent(detail: .init(
                startLocation3D: startLocal,
                globalLocation3D: globalPoint3D
            ))
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }

        if spatializedElement.enableDragGesture {
            let gestureEvent = WebSpatialDragGuestureEvent(detail: .init(
                translation3D: event.translation3D
            ))

            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }

        gestureState.isDrag = true
    }

    private func onDraggingEnded(_ event: DragGesture.Value) {
        gestureState.isDrag = false
        spatialScene.isSpatialElementGestureActive = false
        if spatializedElement.enableDragEndGesture {
            let gestureEvent = WebSpatialDragEndGuestureEvent()
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    /// Z offset that defines the local coordinate system (front face = z=0).
    /// Only backOffset and zIndex*bias; excludes translation.z (CSS translateZ is visual-only).
    private func localFrameOffsetZ() -> Double {
        (spatializedElement.zIndex * zOrderBias) + spatializedElement.backOffset
    }

    /// Wrap CSS transform with anchor (CSS transform-origin) since
    /// transform3DEffect does not support anchor. Preserves the original
    /// CSS transform order (e.g. rotateX(90deg) translateZ(100px)).
    private func anchoredCSSTransform() -> AffineTransform3D {
        let anchor = spatializedElement.rotationAnchor
        let ax = spatializedElement.width * anchor.x
        let ay = spatializedElement.height * anchor.y
        let toAnchor = AffineTransform3D(translation: Vector3D(x: -ax, y: -ay, z: 0))
        let fromAnchor = AffineTransform3D(translation: Vector3D(x: ax, y: ay, z: 0))
        return fromAnchor.concatenating(spatializedElement.transform).concatenating(toAnchor)
    }

    /// Maps a SpatialScene point into the element's own local space: top-left origin,
    /// CSS pixels, front face at z = 0. Inverts the whole placement chain
    /// (CSS transform, then --xr-back/zIndex, then layout), so the element's own
    /// visual displacement never leaks into the reported offset.
    private func sceneToLocal(_ scenePoint: Point3D) -> Point3D {
        let full = spatializedElement.sceneTransform.concatenating(anchoredCSSTransform())
        guard let inverse = full.inverse else { return scenePoint }
        let p = SIMD4<Double>(scenePoint.x, scenePoint.y, scenePoint.z, 1.0)
        let local = inverse.matrix * p
        return Point3D(x: local.x, y: local.y, z: local.z)
    }

    private func onTapEnded(_ event: SpatialTapGesture.Value) {
        if spatializedElement.enableTapGesture {
            let localPoint3D = sceneToLocal(event.location3D)
            let globalPoint3D = event.location3D
            spatialScene.sendWebMsg(spatializedElement.id, WebSpatialTapGuestureEvent(detail: .init(location3D: localPoint3D, globalLocation3D: globalPoint3D)))
        }
    }

    private func onMagnifyGesture(_ event: MagnifyGesture.Value) {
        if spatializedElement.enableMagnifyGesture {
            let gestureEvent = WebSpatialMagnifyGuestureEvent(
                detail: .init(
                    magnification: event.magnification
                )
            )
            spatialScene.sendWebMsg(spatializedElement.id, gestureEvent)
        }
    }

    private func onMagnifyGestureEnd(_ event: MagnifyGesture.Value) {
        if spatializedElement.enableMagnifyEndGesture {
            spatialScene.sendWebMsg(spatializedElement.id, WebSpatialMagnifyEndGuestureEvent())
        }
    }

    // End Interaction

    var body: some View {
        let width = spatializedElement.width
        let height = spatializedElement.height
        let depth = spatializedElement.depth

        let centerX = spatializedElement.clientX - (spatializedElement.scrollWithParent ? parentScrollOffset.x : 0)
        let centerY = spatializedElement.clientY - (spatializedElement.scrollWithParent ? parentScrollOffset.y : 0)

        let opacity = spatializedElement.opacity
        let visible = spatializedElement.visible
        let enableGesture = spatializedElement.enableGesture

        let frameOffsetZ = localFrameOffsetZ()
        let smallOffset = abs(frameOffsetZ) < 0.0001 ? 0.0001 : 0

        let anchoredTransform = anchoredCSSTransform()

        // when spatialdiv have regular/thick/thin material and alignment is back, there'll be a bug that clipping content
        // so when spatializedElement is spatialdiv, .center alignment will be applied
        let alignment = spatializedElement.defaultAlignment

        content
            .frame(width: width, height: height)
            .frame(depth: depth, alignment: alignment)
            .frame(depth: 0, alignment: .back)
            // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
            .offset(z: smallOffset)
            // Full CSS transform matrix with anchor baked in. Preserves transform
            // composition order; CSS translateZ participates in rotation direction.
            .transform3DEffect(anchoredTransform)
            // backOffset + zIndex: always along parent Z, independent of CSS transform.
            .offset(z: frameOffsetZ)
            // Gestures report in the "SpatialScene" space, never in the modifier chain's
            // own local space, so placement modifiers above cannot skew the reported
            // point. sceneToLocal() derives the element-local coordinate from it.
            .simultaneousGesture(enableGesture ? gesture : nil)
            .onDisappear {
                spatialScene.isSpatialElementGestureActive = false
            }
            .onGeometryChange3D(for: AffineTransform3D.self) { proxy in
                proxy.transform(in: .named("SpatialScene"))!
            } action: { new in
                spatializedElement.proxySceneTransform = new
            }

            .position(x: centerX + width / 2, y: centerY + height / 2)
            .opacity(opacity)
            .hidden(!visible)
    }
}
