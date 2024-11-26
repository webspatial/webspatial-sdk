//
//  PlainWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import RealityKit
import SwiftUI

struct PlainWindowGroupView: View {
    @EnvironmentObject private var sceneDelegate: SceneDelegate
    @Environment(SpatialWindowGroup.self) private var windowGroupContent: SpatialWindowGroup

    @State private var windowResizeInProgress = false
    @State private var timer: Timer?

    private func setSize(size: CGSize) {
        sceneDelegate.window?.windowScene?.requestGeometryUpdate(.Vision(size: size))
    }

    private func toJson(val: SIMD3<Float>) -> String {
        return "{x: " + String(val.x) + ",y: " + String(val.y) + ",z: " + String(val.z) + "}"
    }

    var dragGesture: some Gesture {
        DragGesture().handActivationBehavior(.automatic)
            .targetedToAnyEntity()
            .onChanged { value in
                let startPos = value.convert(value.startLocation3D, from: .local, to: .scene)
                let translate = value.convert(value.location3D, from: .local, to: .scene)
                let spatialEntity = value.entity.components[SpatialBridgeComponent.self]!.spatialEntity
                let ic = spatialEntity.getComponent(SpatialInputComponent.self)!

                if !ic.isDragging {
                    ic.isDragging = true
                    ic.trackedPosition = startPos
                    let delta = translate - ic.trackedPosition
                    ic.trackedPosition = translate

                    ic.wv!.fireGestureEvent(inputComponentID: ic.id, data: "{eventType: 'dragstart', translate: " + toJson(val: delta) + "}")
                } else {
                    let delta = translate - ic.trackedPosition
                    ic.trackedPosition = translate
                    ic.wv!.fireGestureEvent(inputComponentID: ic.id, data: "{eventType: 'dragstart', translate: " + toJson(val: delta) + "}")
                }
            }
            .onEnded { value in
                let spatialEntity = value.entity.components[SpatialBridgeComponent.self]!.spatialEntity
                let ic = spatialEntity.getComponent(SpatialInputComponent.self)!
                ic.wv!.fireGestureEvent(inputComponentID: ic.id, data: "{eventType: 'dragend'}")
                ic.isDragging = false
            }
    }

    var body: some View {
        OpenDismissHandlerUI().environment(windowGroupContent)

        let rootEntity = windowGroupContent.getEntities().filter {
            $0.value.getComponent(SpatialWindowComponent.self) != nil && $0.value.coordinateSpace == .ROOT
        }.first?.value

        GeometryReader { proxy3D in
            ZStack {
                RealityView { _ in

                } update: { content in
                    for (_, entity) in windowGroupContent.getEntities() {
                        content.add(entity.modelEntity)
                    }
                }.opacity(windowResizeInProgress ? 0 : 1)
                    .gesture(dragGesture).offset(z: -0.1)

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
                    }
                }
            }
            .onReceive(windowGroupContent.setSize) { newSize in
                setSize(size: newSize)
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
                    timer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: false) { _ in
                        windowResizeInProgress = false
                    }

                    // Trigger resize in the webview's body width and fire a window resize event to get the JS on the page to update state while dragging occurs
                    wv.evaluateJS(js: "var tempWidth_ = document.body.style.width;document.body.style.width='" + String(Float(proxy3D.size.width)) + "px'; window.dispatchEvent(new Event('resize'));")
                }
            }
        }
    }
}
