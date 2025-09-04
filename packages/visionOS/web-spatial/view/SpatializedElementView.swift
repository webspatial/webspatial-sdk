
import RealityKit
import SwiftUI



// zIndex() have some bug, so use zOrderBias to simulate zIndex effect
let zOrderBias = 0.001

struct SpatializedElementView<Content: View>: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
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
        print("\(spatializedElement.name) onRotateGesture3D \(event.rotation) ")
    }
    
    private func onRotateGesture3DEnd(_ event: RotateGesture3D.Value) {
        print("\(spatializedElement.name) onRotateGesture3DEnd \(event.rotation) ")
    }

    private func onDragging(_ event: DragGesture.Value) {
        print("\(spatializedElement.name)  onDragging \(event.location3D)")
    }

    private func onDraggingEnded(_ event: DragGesture.Value) {
        print("\(spatializedElement.name)  onDraggingEnded \(event.location3D)")
    }

    private func onTapEnded(_ event: SpatialTapGesture.Value) {
        print("\(spatializedElement.name)  onTapEnded \(event.location3D)")
    }

    private func onMagnifyGesture(_ event: MagnifyGesture.Value) {
        print("\(spatializedElement.name)  onMagnifyGesture \(event.magnification)")
    }
    
    private func onMagnifyGestureEnd(_ event: MagnifyGesture.Value) {
        print("\(spatializedElement.name)  onMagnifyGestureEnd \(event.magnification)")
    }

    // End Interaction

    @ViewBuilder
    var body: some View {
        let transform = spatializedElement.transform
        let parentYOffset = parentScrollOffset.y
        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation
        let x = CGFloat(translation.x)
        let y = spatializedElement.scrollWithParent ? (CGFloat(translation.y) - parentYOffset) : 0

        let z = CGFloat(translation.z) + (spatializedElement.zIndex * zOrderBias)
        let width = CGFloat(spatializedElement.width)
        let height = CGFloat(spatializedElement.height)
        let depth = CGFloat(spatializedElement.depth)
        let anchor = spatializedElement.rotationAnchor

        let opacity = spatializedElement.opacity
        let visible = spatializedElement.visible
        let enableGesture = spatializedElement.enableGesture
        let clip = spatializedElement.clip


        content.simultaneousGesture(enableGesture ? gesture : nil)
            .frame(width: width, height: height)
            .frame(depth: depth, alignment: .back)
            .onGeometryChange3D(for: AffineTransform3D.self) { proxy in
                print(" width \(proxy.size.width)  height \(proxy.size.height)  depth \(proxy.size.depth) ")
                let rect3d = proxy.frame(in: .named("SpatialScene"))

                print(" \(spatializedElement.name) rect3d max \(rect3d.max)  min \(rect3d.min) ")

                return proxy.transform(in: .named("SpatialScene"))!
            } action: { _, new in
                print(" \(spatializedElement.name) transform \(new)  ")
            }.if(clip, transform: { view in
                    view.clipped()
            })
            
            .frame(depth: 0, alignment: .back)
            //            .background(Color(hex: "#161616E5"))
            // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
            .offset(z: 0.0001)
            .scaleEffect(
                x: CGFloat(scale.x),
                y: CGFloat(scale.y),
                z: CGFloat(scale.z),
                anchor: anchor
            )
            .rotation3DEffect(
                Rotation3D(rotation),
                anchor: anchor
            )
            .offset(x: x, y: y)
            .offset(z: z)
            .opacity(opacity)
            .hidden(!visible)
    }
}
