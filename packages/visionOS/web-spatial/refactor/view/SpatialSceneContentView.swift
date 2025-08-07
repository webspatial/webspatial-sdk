import RealityKit
import SwiftUI

struct SpatialSceneContentView: View {
    @State var sceneId: String
    var width: Double
    var height: Double
    
    var body: some View {
        GeometryReader { proxy3D in
            ZStack {
                if let spatialScene = SpatialApp.Instance.getScene(sceneId) {
                    
                    // Display the main webview
                    spatialScene.getView()
                        .materialWithBorderCorner(
                            spatialScene.backgroundMaterial,
                            spatialScene.cornerRadius
                        )
                        .frame(width: width, height: height)
                    
                    ZStack {
                        let childrenOfSpatialized2DElement: [SpatializedElement] = Array(spatialScene.getChildrenOfType(.Spatialized2DElement).values)
                        
                        ForEach(childrenOfSpatialized2DElement, id: \.id) { child in
                            SpatializedElementView(parentScrollOffset: spatialScene.scrollOffset) {
                                Spatialized2DView()
                            }
                            .environment(child)
                        }
                        
                        let childrenOfSpatializedStatic3DElement: [SpatializedElement] = Array(spatialScene.getChildrenOfType(.SpatializedStatic3DElement).values)
                        ForEach(childrenOfSpatializedStatic3DElement, id: \.id) { child in
                            SpatializedElementView(parentScrollOffset: spatialScene.scrollOffset) {
                                SpatializedStatic3DView()
                            }
                            .environment(child)
                        }
                        
                    }.environment(spatialScene)
                    
                }
            }
        }
    }
}
