// TODO: extends SpatializedDivView

import SwiftUI

struct SpatialSceneView: View {
    @Environment(SpatialScene.self) private var scene: SpatialScene
    @State var web: SpatialWebviewModelFake?

    var body: some View {
        ZStack {}.onAppear {
            web = SpatialWebviewModelFake(url: scene.url)
            web!.onCallBack("forceStyle") { _ in
                // TODO: handle forceStyle
                print("got forceStyle")
            }
            web!.addJSBListener("createSpatialDiv") { _ in
                print("got createSpatialDiv")
            }
        }
        if let _web = web {
            _web.getView()
        }
    }
}
