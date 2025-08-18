
import RealityKit
import SwiftUI

extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

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
                )
                .simultaneously(with:
                    MagnifyGesture()
                        .onChanged(onMagnifyGesture)
                )
                .simultaneously(with:
                    SpatialTapGesture(count: 1)
                        .onEnded(onTapEnded)
                )
                .simultaneously(with:
                            SpatialEventGesture()
                        .onChanged { events in
//                            for event in events {
//                                print("SpatialEventGesture \(event)")
//                            }
                        }
                        .onEnded { events in
                        }
                )
    }
    
    private func getGesture() {
        
    }
    
    private func onRotateGesture3D(_ event: RotateGesture3D.Value) {
        print("\(spatializedElement.name) onRotateGesture3D \(event) ")
    }
    
    private func onDragging(_ event: DragGesture.Value) {
        print("\(spatializedElement.name)  onDragging \(event)")
    }

    private func onDraggingEnded(_ event: DragGesture.Value) {
        print("\(spatializedElement.name)  onDraggingEnded \(event)")
    }

    private func onTapEnded(_ event: SpatialTapGesture.Value) {
        print("\(spatializedElement.name)  onTapEnded \(event.location3D)")
    }
    
    private func onMagnifyGesture(_ event: MagnifyGesture.Value) {
        print("\(spatializedElement.name)  onMagnifyGesture \(event)")
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
        let anchor = spatializedElement.rotationAnchor

        let opacity = spatializedElement.opacity
        let visible = spatializedElement.visible
        let enableGesture = spatializedElement.enableGesture

        // Matrix = MTranslate X MRotate X MScale
        content.if(enableGesture) { view in
            view.simultaneousGesture(gesture)
        }.frame(width: width, height: height)
            .frame(depth: 10, alignment:  .back)
            .onGeometryChange3D(for: AffineTransform3D.self) { proxy in
                print(" width \(proxy.size.width)  height \(proxy.size.height)  depth \(proxy.size.depth) ")
                let rect3d =  proxy.frame(in: .named("SpatialScene"))
                          
              
                print(" \(spatializedElement.name) rect3d   \(rect3d)  \(rect3d.min.x) \(rect3d.max.x)")

                return proxy.transform(in: .named("SpatialScene"))!
            } action: { old, new in
//                print(" \(spatializedElement.name) \(new.translation)  ")
            }
            .clipped()
            .frame(depth: 0, alignment:  .back)
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

