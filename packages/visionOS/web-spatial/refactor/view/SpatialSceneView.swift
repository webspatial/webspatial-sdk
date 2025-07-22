
import RealityKit
import SwiftUI

struct SpatialSceneView: View {
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    var body: some View {
        GeometryReader { proxy3D in
            let width = proxy3D.size.width
            let height = proxy3D.size.height

            let childrenOfSpatialized2DElement: [SpatializedElement] = Array(spatialScene.getChildrenOfType(.Spatialized2DElement).values)

            ZStack {
                ZStack {
                    ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                        renderChildSpatialized2DElement(for: child, parentYOffset: 0)
                    }
                }.frame(maxWidth: .infinity, maxHeight: .infinity).frame(maxDepth: 0, alignment: .back).offset(z: 0)

                // Display the main webview
                spatialScene.getView()
                    .materialWithBorderCorner(
                        spatialScene.backgroundMaterial,
                        spatialScene.cornerRadius
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }.frame(width: width, height: height).padding3D(.front, -100_000)
        }
    }

    private func renderChildSpatialized2DElement(for child: SpatializedElement, parentYOffset: Float) -> some View {
        let childSpatialized2DElement = child as! Spatialized2DElement
        let transform = child.transform

        let translation = transform.translation
        let scale = transform.scale
        let rotation = transform.rotation
        let x = CGFloat(translation.x)
        let y = CGFloat(translation.y - (childSpatialized2DElement.scrollEnabled ? 0 : parentYOffset))
        let z = CGFloat(translation.z) + (childSpatialized2DElement.zIndex * zOrderBias)
        let width = CGFloat(child.width)
        let height = CGFloat(child.height)
        let anchor = child.rotationAnchor

        // Matrix = MTranslate X MRotate X MScale
        return Spatialized2DView().environment(childSpatialized2DElement)
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
    }
}
