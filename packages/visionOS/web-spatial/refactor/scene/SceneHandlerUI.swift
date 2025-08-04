import SwiftUI

struct SceneHandlerUI: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    @EnvironmentObject private var sceneDelegate: SceneDelegate

    @State var sceneId: String

    @Environment(\.scenePhase) private var scenePhase

    private func setResizibility(resizingRestrictions: UIWindowScene.ResizingRestrictions) {
        sceneDelegate.window?.windowScene?
            .requestGeometryUpdate(
                .Vision(
                    resizingRestrictions: resizingRestrictions
                )
            )
    }

    private func setResizeRange(resizeRange: ResizeRange) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.0) {
            sceneDelegate.window?.windowScene?
                .requestGeometryUpdate(
                    .Vision(
                        minimumSize: CGSize(
                            width: resizeRange.minWidth ?? 0,
                            height: resizeRange
                                .minHeight ?? 0
                        ),
                        maximumSize: CGSize(
                            width: resizeRange.maxWidth ?? .infinity,
                            height: resizeRange.maxHeight ?? .infinity
                        )
                    )
                ) { error in
                    print("error:", error)
                }
        }
    }

    var body: some View {

        if let scene = SpatialApp.Instance.getScene(sceneId) {
            VStack {}
                .onAppear {
                    let wd = SpatialApp.Instance.getPlainSceneOptions()
                    if let range = wd.resizeRange {
                        self.setResizeRange(resizeRange: range)
                        if (range.minWidth != nil || range.minHeight != nil) && range.minWidth == range.maxWidth && range.minHeight == range.maxHeight {
                            self.setResizibility(resizingRestrictions: .none)
                        } else {
                            self.setResizibility(resizingRestrictions: .freeform)
                        }
                    }
                }
                .onDisappear {
                    scene.destroy()
                }
                .onReceive(scene.toggleImmersiveSpace) { v in
                    if v {
                        Task {
                            await openImmersiveSpace(id: "ImmersiveSpace")
                        }
                    } else {
                        Task {
                            await dismissImmersiveSpace()
                        }
                    }
                }
                .onReceive(scene.openWindowData) { wd in
                    if let spatialScene = SpatialApp.Instance.getScene(wd.sceneID){
                        let _ = openWindow(
                            id: spatialScene.windowStyle.rawValue,
                            value: wd
                        )
                    }
                    
                }
                .onReceive(scene.closeWindowData) { wd in
                    if let spatialScene = SpatialApp.Instance.getScene(wd.sceneID){
                        dismissWindow(
                            id: spatialScene.windowStyle.rawValue,
                            value: wd
                        )
                    }
                    
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
}
