
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
        content
            .frame(width: width, height: height)
            //.frame(depth: 800, alignment:  .front)
            //.background(Color(hex: "#161616E5"))
            // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
//            .offset(z: 0.0001)
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
            .opacity(opacity)
            .hidden(!visible)
    }
}


struct PreviewSpatializedStatic3DElement: View {
    var sceneId: String
    
    init() {
        let spatialScene = SpatialApp.Instance.createScene(
            "http://localhost:5173/",
            .plain,
            .visible
        )
        
        let spatializedStatic3DElement: SpatializedStatic3DElement = spatialScene.createSpatializedElement(
            .SpatializedStatic3DElement
        )
        spatializedStatic3DElement.transform.translation.x = 500
        spatializedStatic3DElement.transform.translation.y = 100
        spatializedStatic3DElement.transform.translation.z = 0
        spatializedStatic3DElement.width = 200
        spatializedStatic3DElement.height = 200
        spatializedStatic3DElement.enableTapEvent = false
         
        spatializedStatic3DElement.modelURL = "http://localhost:5173/public/modelasset/cone.usdz"
        spatializedStatic3DElement.setParent(spatialScene)
        sceneId = spatialScene.id
    }
    
    var body: some View {
        SpatialSceneContentView(sceneId: sceneId, width: 1200, height: 800)
    }
}

#Preview("PreviewSpatializedStatic3DElement") {
    PreviewSpatializedStatic3DElement()
}
