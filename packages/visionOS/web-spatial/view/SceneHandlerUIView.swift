import SwiftUI

struct SceneHandlerUIView: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    @EnvironmentObject private var sceneDelegate: SceneDelegate

    @State var sceneId: String

    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        if let scene = SpatialApp.Instance.getScene(sceneId) {
            VStack {}
                .onDisappear {
                    print("onScene Disappear")
                    scene.destroy()
                }
                .onReceive(scene.openWindowData) { sceneID in
                    if let spatialScene = SpatialApp.Instance.getScene(sceneID){
                        let _ = openWindow(
                            id: spatialScene.windowStyle.rawValue,
                            value: sceneID
                        )
                    }
                    
                }
                .onReceive(scene.closeWindowData) { sceneID in
                    if let spatialScene = SpatialApp.Instance.getScene(sceneID){
                        dismissWindow(
                            id: spatialScene.windowStyle.rawValue,
                            value: sceneID
                        )
                    }
                    
                }
                .onReceive(scene.setLoadingWindowData) { wd in
                    if wd.method == .show {
                        openWindow(id: "loading", value: wd.sceneID)
                    } else if wd.method == .hide {
                        dismissWindow(id: "loading",value: wd.sceneID)
                    }
                }

                .onChange(of: scenePhase) { oldValue, newValue in
                    logger.debug("OpenDismissHandlerUI: Value changed from \(oldValue) to \(newValue)")
                }
        }
    }
}
