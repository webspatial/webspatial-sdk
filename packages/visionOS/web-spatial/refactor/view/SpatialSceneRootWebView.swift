import RealityKit
import SwiftUI

struct SpatialSceneRootWebView: View {
    @State var sceneId: String

    var body: some View {
        GeometryReader { proxy3D in
            let width = proxy3D.size.width
            let height = proxy3D.size.height

            ZStack {
                if let spatialScene = SpatialApp.Instance.getScene(sceneId) {
                    ZStack {
                        let childrenOfSpatialized2DElement: [SpatializedElement] = Array(spatialScene.getChildrenOfType(.Spatialized2DElement).values)

                        ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                            SpatializedElementView(parentScrollOffset: spatialScene.scrollOffset) {
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
                        .frame(width: width, height: height)
                        .padding3D(.front, -100_000)
                        .onAppear(){
                            spatialScene.spatialWebViewModel.load()
                        }
                }
            }
        }
    }
}

struct PreviewSpatialScene: View {
    var sceneId: String

    init() {
        let spatialScene = SpatialApp.Instance.createScene(
            "http://localhost:5173/",
            .plain,
            .success
        )
        spatialScene.cornerRadius.bottomLeading = 130
        let spatialized2DElement: Spatialized2DElement = spatialScene.createSpatializedElement(type: .Spatialized2DElement)
        spatialized2DElement.transform.translation.x = 200
        spatialized2DElement.transform.translation.y = 200
        spatialized2DElement.transform.translation.z = 200
        spatialized2DElement.width = 200
        spatialized2DElement.height = 200
        let htmlString = """
        <!DOCTYPE html>
        <html>
            <body>
                hello world
            </body>
        </html>
        """
        spatialized2DElement.loadHtml(htmlString)
        spatialized2DElement.setParent(spatialScene)
        sceneId = spatialScene.id
    }

    var body: some View {
        SpatialSceneRootWebView(sceneId: sceneId)
    }
}

// #Preview("Test SpatialScene", windowStyle: .automatic) {
//    PreviewSpatialScene()
// }
