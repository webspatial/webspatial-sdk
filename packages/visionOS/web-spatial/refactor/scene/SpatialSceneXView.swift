// TODO: extends SpatializedDivView

import SwiftUI

struct SpatialSceneXView: View {
    @EnvironmentObject private var sceneDelegate: SceneDelegate
    @Environment(SpatialSceneX.self) private var scene: SpatialSceneX
    @State var web: SpatialWebViewModel?

    private func setSize(size: CGSize) {
        sceneDelegate.window?.windowScene?
            .requestGeometryUpdate(
                .Vision(
                    size: size
                )
            )
    }

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
        SceneHandlerUI().environment(scene).onDisappear {
            print("SceneHandlerUI::onDisapper", scene.getSceneData())
            scene.destroy()
        }
        if let model = scene.spatialWebviewModel {
            model.getView()?.onAppear {
                model.load()
            }
        }

        ZStack {}
            .onReceive(scene.setSize) { newSize in
                setSize(size: newSize)
            }
            .onReceive(scene.setResizeRange) { resizeRange in
                self.setResizeRange(resizeRange: resizeRange)
            }
            .onAppear {
                let wd = WindowContainerMgr.Instance.getValue()
                if let range = wd.resizeRange {
                    self.setResizeRange(resizeRange: range)
                    if (range.minWidth != nil || range.minHeight != nil) && range.minWidth == range.maxWidth && range.minHeight == range.maxHeight {
                        self.setResizibility(resizingRestrictions: .none)
                    } else {
                        self.setResizibility(resizingRestrictions: .freeform)
                    }
                }
            }
    }
}
