
import RealityKit
import SwiftUI

struct SpatializedElementView<Content: View>: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    var parentYOffset = Float(0.0)
    var content: Content

    init(parentYOffset: Float, @ViewBuilder content: () -> Content) {
        self.parentYOffset = parentYOffset
        self.content = content()
    }

    @ViewBuilder
    var body: some View {
        let transform = spatializedElement.transform

        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation
        let x = CGFloat(translation.x)
        let y = CGFloat(translation.y - (spatializedElement.scrollWithParent ? parentYOffset : 0))

        let z = CGFloat(translation.z) + (spatializedElement.zIndex * zOrderBias)
        let width = CGFloat(spatializedElement.width)
        let height = CGFloat(spatializedElement.height)
        let anchor = spatializedElement.rotationAnchor

        let opacity = spatializedElement.opacity
        let visible = spatializedElement.visible

        // Matrix = MTranslate X MRotate X MScale
        content
            .frame(width: width, height: height)
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
            .position(x: x, y: y)
            .offset(z: z)
            .frame(maxDepth: 0, alignment: .back)
            .offset(z: 0)
            .opacity(opacity)
            .hidden(!visible)
    }
}
