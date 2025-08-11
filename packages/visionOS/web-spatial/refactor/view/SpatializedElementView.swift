
import RealityKit
import SwiftUI

struct SpatializedElementView<Content: View>: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    var parentScrollOffset: Vec2
    var content: Content

    init(parentScrollOffset: Vec2, @ViewBuilder content: () -> Content) {
        self.parentScrollOffset = parentScrollOffset
        self.content = content()
    }

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

        // Matrix = MTranslate X MRotate X MScale
        content.frame(width: width, height: height)
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
