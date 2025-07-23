
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

#Preview(windowStyle: .automatic) {
    SpatialSceneView()
        .environment(SpatialScene("https://www.baidu.com/"))
}
