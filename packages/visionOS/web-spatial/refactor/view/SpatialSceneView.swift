
import RealityKit
import SwiftUI

struct SpatialSceneView: View {
    @Environment(SpatialScene.self) var spatialScene: SpatialScene

    var body: some View {
        GeometryReader { proxy3D in
            let width = proxy3D.size.width
            let height = proxy3D.size.height

            ZStack {
                ZStack {
                    let childrenOfSpatialized2DElement: [SpatializedElement] = Array(spatialScene.getChildrenOfType(.Spatialized2DElement).values)

                    ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                        SpatializedElementView(parentYOffset: 0) {
                            Spatialized2DView()
                        }
                        .environment(child)
                    }
                }

                // Display the main webview
                spatialScene.getView()
                    .materialWithBorderCorner(
                        spatialScene.backgroundMaterial,
                        spatialScene.cornerRadius
                    )
                    .frame(width: width, height: height).padding3D(.front, -100_000)
            }
        }
    }
}

struct PreviewSpatialScene: View {
    var spatialScene = SpatialScene("https://www.google.com/")

    init() {
        spatialScene.cornerRadius.bottomLeading = 130

        var spatialized2DElement: Spatialized2DElement = spatialScene.createSpatializedElement(type: .Spatialized2DElement)

        spatialized2DElement.transform.translation.x = 200
        spatialized2DElement.transform.translation.y = 200
        spatialized2DElement.width = 200
        spatialized2DElement.height = 200
        spatialized2DElement.loadHtml()

//        spatialScene.addChild(spatialized2DElement)
    }

    var body: some View {
        SpatialSceneView()
            .environment(spatialScene)
    }
}

#Preview("Test SpatialScene", windowStyle: .automatic) {
    PreviewSpatialScene()
}
