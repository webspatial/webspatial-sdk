import SwiftUI

struct SceneHandlerUI: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow

    @Environment(SpatialScene.self) var scene: SpatialScene

    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        VStack {}
            .onAppear()
//            .onReceive(scene.toggleImmersiveSpace) { v in
//                if v {
//                    Task {
//                        await openImmersiveSpace(id: "ImmersiveSpace")
//                    }
//                } else {
//                    Task {
//                        await dismissImmersiveSpace()
//                    }
//                }
//            }
            .onReceive(scene.openWindowData) { wd in
                let _ = openWindow(id: wd.windowStyle, value: wd)
            }
            .onReceive(scene.closeWindowData) { wd in
                dismissWindow(id: wd.windowStyle, value: wd)
            }
            .onReceive(scene.setLoadingWindowData) { wd in
                if wd.method == .show {
                    openWindow(id: "loading")
                } else if wd.method == .hide {
                    dismissWindow(id: "loading")
                }
            }

            .onChange(of: scenePhase) { oldValue, newValue in
                logger.debug("OpenDismissHandlerUI: Value changed from \(oldValue) to \(newValue)")
            }
    }
}
