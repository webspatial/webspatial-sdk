import RealityKit
import SwiftUI

struct SpatialSceneContentView: View {
    @State var sceneId: String
    var width: Double
    var height: Double
    
    var body: some View {
        if let spatialScene = SpatialApp.Instance.getScene(sceneId) {
            ZStack(alignment: Alignment.topLeading) {
                // Display the main webview
                spatialScene.getView()
                    .materialWithBorderCorner(
                        spatialScene.backgroundMaterial,
                        spatialScene.cornerRadius
                    )
                    .frame(width: width, height: height)
                
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
        spatializedStatic3DElement.transform.translation.x = 200
        spatializedStatic3DElement.transform.translation.y = 300
        spatializedStatic3DElement.transform.translation.z = 0
        spatializedStatic3DElement.name = "jack"
        
        spatializedStatic3DElement.width = 200
        spatializedStatic3DElement.height = 100
        spatializedStatic3DElement.enableTapEvent = false
         
        spatializedStatic3DElement.modelURL = "http://localhost:5173/public/modelasset/cone.usdz"
        spatializedStatic3DElement.setParent(spatialScene)
        
        let spatializedStatic3DElementB: SpatializedStatic3DElement = spatialScene.createSpatializedElement(
            .SpatializedStatic3DElement
        )
        spatializedStatic3DElementB.transform.translation.x = 700
        spatializedStatic3DElementB.transform.translation.y = 300
        spatializedStatic3DElementB.transform.translation.z = 0
        spatializedStatic3DElementB.width = 200
        spatializedStatic3DElementB.height = 200
        spatializedStatic3DElementB.enableTapEvent = false
        spatializedStatic3DElementB.name = "tom"

        spatializedStatic3DElementB.modelURL = "http://localhost:5173/public/modelasset/vehicle-speedster.usdz"
        spatializedStatic3DElementB.setParent(spatialScene)
        
        sceneId = spatialScene.id
        
        print("spatialScene \(spatialScene)")
    }
    
    var body: some View {
        SpatialSceneContentView(sceneId: sceneId, width: 1200, height: 1000)
    }
}

struct PreviewSpatialized2DElement: View {
    var sceneId: String
    
    init() {
        let spatialScene = SpatialApp.Instance.createScene(
            "http://localhost:5173/",
            .plain,
            .visible
        )
        
        let spatializedElementA: Spatialized2DElement = spatialScene.createSpatializedElement(
            .Spatialized2DElement
        )
        spatializedElementA.transform.translation.x = 200
        spatializedElementA.transform.translation.y = 300
        spatializedElementA.transform.translation.z = 0
        spatializedElementA.name = "jack"
        
        spatializedElementA.width = 200
        spatializedElementA.height = 100
        spatializedElementA.load("http://localhost:5173/src/")
        
        spatializedElementA.setParent(spatialScene)
        
        let spatializedElementB: Spatialized2DElement = spatialScene.createSpatializedElement(
            .Spatialized2DElement
        )
        spatializedElementB.transform.translation.x = 400
        spatializedElementB.transform.translation.y = 300
        spatializedElementB.transform.translation.z = 0
        spatializedElementB.name = "jack"
        
        spatializedElementB.width = 200
        spatializedElementB.height = 100
        spatializedElementB.load("http://localhost:5173/src/embed/")
        spatializedElementB.setParent(spatialScene)
        
        sceneId = spatialScene.id
        
        print("spatialScene \(spatialScene)")
    }
    
    var body: some View {
        SpatialSceneContentView(sceneId: sceneId, width: 1200, height: 1000)
    }
}

#Preview("PreviewSpatialized2DElement") {
    PreviewSpatialized2DElement()
}

#Preview("PreviewSpatializedStatic3DElementWithRotation") {
    PreviewSpatializedStatic3DElement()
}
