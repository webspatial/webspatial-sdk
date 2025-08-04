import SwiftUI

struct SpatialSceneView: View {
    @State var sceneId: String

    var body: some View {
        SceneHandlerUI(sceneId: sceneId)
        SpatialSceneRootWebView(sceneId: sceneId)
    }
}
