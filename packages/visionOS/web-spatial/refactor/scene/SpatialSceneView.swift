// TODO: extends SpatializedDivView

import SwiftUI

struct SpatialSceneView: View {
    @Environment(SpatialScene.self) private var scene: SpatialScene
    @State var web: SpatialWebViewModel?

    var body: some View {
        SceneHandlerUI().environment(scene).onDisappear {
            print("SceneHandlerUI::onDisapper", scene.wgd)
            scene.destroy()
        }
        if let model = scene.spatialWebviewModel {
            model.getView()?.onAppear {
                model.load()
            }
        }

        ZStack {
//            if let _web = web {
//                _web.getView()
//            }
        }.onAppear {
            print("scene.url", scene.url)
//            scene.spatialWebviewModel?.load()
//            scene.spatialWebviewModel?.load(scene.url)
//            web = SpatialWebViewModel(url: scene.url)
//            scene.spatialWebviewModel = web
//            web?.load()
//            web!.onCallBack("forceStyle") { _ in
//                // TODO: handle forceStyle
//                print("got forceStyle")
//            }
//            web!.addJSBListener("createSpatialDiv") { _ in
//                print("got createSpatialDiv")
//            }
//        }
        }
    }
}
