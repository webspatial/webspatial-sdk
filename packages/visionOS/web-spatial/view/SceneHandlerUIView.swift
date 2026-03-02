import Combine
import SwiftUI

struct SceneHandlerUIView: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    @EnvironmentObject private var sceneDelegate: SceneDelegate

    @State var spatialScene: SpatialScene

    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.physicalMetrics) private var converter
    @State private var cancellables = Set<AnyCancellable>()
    @State private var scaledSubject = PassthroughSubject<Double, Never>()
    @State private var unscaledSubject = PassthroughSubject<Double, Never>()

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
        let meter2ptScaled = converter.worldScalingCompensation(.scaled).convert(
            1,
            from: .meters
        )
        let meter2ptUnscaled = converter.worldScalingCompensation(.unscaled).convert(
            1,
            from: .meters
        )
        VStack {}
            .onAppear {
                // Combine both subjects to update metrics together
                Publishers.CombineLatest(scaledSubject, unscaledSubject)
                    .removeDuplicates(by: { abs($0.0 - $1.0) < 0.01 && abs($0.1 - $1.1) < 0.01 })
                    .debounce(for: .milliseconds(200), scheduler: RunLoop.main)
                    .sink { scaled, unscaled in
//                        print("debounced:meter2ptScaled:\(scaled), meter2ptUnscaled:\(unscaled)")
                        spatialScene.onUpdatePhysicalMetrics(meterToPtUnscaled: unscaled, meterToPtScaled: scaled)
                    }
                    .store(in: &cancellables)

                // Seed subjects with current values to start the pipeline
                scaledSubject.send(meter2ptScaled)
                unscaledSubject.send(meter2ptUnscaled)
            }
            .onChange(of: meter2ptScaled) { _, newValue in
                scaledSubject.send(newValue)
            }
            .onChange(of: meter2ptUnscaled) { _, newValue in
                unscaledSubject.send(newValue)
            }.onAppear {
                // window scene only resize logic
                guard spatialScene.windowStyle == .window else {
                    return
                }
                if let range = spatialScene.sceneConfig?.resizeRange {
                    self.setResizeRange(resizeRange: range)
                    if (range.minWidth != nil || range.minHeight != nil) && range.minWidth == range.maxWidth && range.minHeight == range.maxHeight {
                        self.setResizibility(resizingRestrictions: .none)
                    } else {
                        self.setResizibility(resizingRestrictions: .freeform)
                    }
                }
            }
            .onDisappear {
                print("onScene Disappear")
                cancellables.removeAll()
                spatialScene.destroy()
            }
            .onReceive(spatialScene.openWindowData) { sceneID in
                if let spatialScene = SpatialApp.Instance.getScene(sceneID) {
                    let _ = openWindow(
                        id: spatialScene.windowStyle.rawValue,
                        value: sceneID
                    )
                }
            }
            .onReceive(spatialScene.closeWindowData) { sceneID in
                if let spatialScene = SpatialApp.Instance.getScene(sceneID) {
                    dismissWindow(
                        id: spatialScene.windowStyle.rawValue,
                        value: sceneID
                    )
                }
            }
            .onReceive(spatialScene.setLoadingWindowData) { wd in
                if wd.method == .show {
                    openWindow(id: "loading", value: wd.sceneID)
                } else if wd.method == .hide {
                    dismissWindow(id: "loading", value: wd.sceneID)
                }
            }

            .onChange(of: scenePhase) { oldValue, newValue in
                logger.debug("OpenDismissHandlerUI: Value changed from \(oldValue) to \(newValue)")
            }
    }
}
