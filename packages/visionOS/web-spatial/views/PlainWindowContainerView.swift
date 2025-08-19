import RealityKit
import SwiftUI

struct PlainWindowContainerView: View {
    @EnvironmentObject private var sceneDelegate: SceneDelegate
    @Environment(SpatialWindowContainer.self) private var windowContainerContent: SpatialWindowContainer

    @State private var windowResizeInProgress = false
    @State private var timer: Timer?

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
        OpenDismissHandlerUI().environment(windowContainerContent).onDisappear {
            windowContainerContent.destroy()
        }

        let rootEntity = windowContainerContent.getEntities().filter {
            $0.value.getComponent(SpatialWindowComponent.self) != nil && $0.value.coordinateSpace == .ROOT
        }.first?.value

        GeometryReader { proxy3D in
            ZStack {
                if let e = rootEntity {
                    let _ = e.forceUpdate ? 0 : 0
                    let x = proxy3D.size.width / 2
                    let y = proxy3D.size.height / 2
                    let z = CGFloat(e.modelEntity.position.z)
                    let width = proxy3D.size.width
                    let height = proxy3D.size.height

                    if windowResizeInProgress {
                        VStack {}.frame(width: width, height: height).glassBackgroundEffect().padding3D(.front, -100_000)
                            .position(x: x, y: y)
                            .offset(z: z)
                    } else {
                        // Avoid showing webview until its loading completes
                        let wc = e.getComponent(SpatialWindowComponent.self)
                        let didFinishFirstLoad = wc != nil ? wc!.didFinishFirstLoad : false
                        SpatialWebViewUI().environment(e)
                            .frame(width: width, height: height).padding3D(.front, -100_000)
                            .rotation3DEffect(Rotation3D(simd_quatf(ix: e.modelEntity.orientation.vector.x, iy: e.modelEntity.orientation.vector.y, iz: e.modelEntity.orientation.vector.z, r: e.modelEntity.orientation.vector.w)))
                            .position(x: x, y: y)
                            .offset(z: z)
                            .opacity(didFinishFirstLoad ? 1.0 : 0.0)
                            .animation(.linear(duration: 0.2), value: didFinishFirstLoad)
                            .ornament(attachmentAnchor: .scene(.top), contentAlignment: .center) {
                                if pwaManager.display != .fullscreen {
                                    ZStack {
                                        NavView(swc: wc, navInfo: wc!.navInfo).offset(y: -15)
                                    }.frame(height: 100)
                                }
                            }
                    }
                }
            }
            .onReceive(windowContainerContent.setSize) { newSize in
                setSize(size: newSize)
            }
            .onReceive(windowContainerContent.setResizeRange) { resizeRange in
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
            .onChange(of: proxy3D.size) {
                // WkWebview has an issue where it doesn't resize while the swift window is resized
                // Treid to call didMoveToWindow to force redraw to occur but that seemed to cause rendering artifacts so that solution was rejected
                // Now we use a windowResizeInProgress state to hide the webview (by removoving from the view) and other content (using opacity).
                // After resize is completed the webview is added back to the page which causes a redraw at the correct dimensions/position
                if let wv = rootEntity?.getComponent(SpatialWindowComponent.self) {
                    windowResizeInProgress = true
                    if timer != nil {
                        timer!.invalidate()
                    }
                    // If we don't detect resolution change after x seconds we treat the resize as complete
                    timer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: false) { _ in
                        windowResizeInProgress = false
                    }

                    // Trigger resize in the webview's body width and fire a window resize event to get the JS on the page to update state while dragging occurs
                    wv.evaluateJS(js: "var tempWidth_ = document.body.style.width;document.body.style.width='" + String(Float(proxy3D.size.width)) + "px'; window.dispatchEvent(new Event('resize'));")
                }
            }
        }
    }
}
