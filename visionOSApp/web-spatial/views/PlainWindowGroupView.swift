//
//  PlainWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import RealityKit
import SwiftUI

struct OpenDismissHandlerUI: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow

    @ObservedObject var windowGroupContent: WindowGroupContentDictionary

    var body: some View {
        VStack {}.onAppear().onReceive(windowGroupContent.$toggleImmersiveSpace.dropFirst()) { v in
            if v {
                Task {
                    await openImmersiveSpace(id: "ImmersiveSpace")
                }
            } else {
                Task {
                    await dismissImmersiveSpace()
                }
            }

        }.onReceive(windowGroupContent.$openWindowData.dropFirst()) { wd in
            let _ = openWindow(id: wd!.windowStyle, value: wd!)
        }.onReceive(windowGroupContent.$closeWindowData.dropFirst()) { wd in
            dismissWindow(id: wd!.windowStyle, value: wd!)
        }
    }
}

struct SpatialWebViewUI: View {
    @ObservedObject var wv: SpatialWebView

    var body: some View {
        wv.webViewNative
            .background(wv.glassEffect || wv.transparentEffect ? Color.clear.opacity(0) : Color.white)
            .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: wv.cornerRadius), displayMode: wv.glassEffect ? .always : .never)
            .cornerRadius(wv.cornerRadius)
            .opacity(wv.visible ? 1 : 0)
    }
}

struct PlainWindowGroupView: View {
    @EnvironmentObject var sceneDelegate: SceneDelegate
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    @ObservedObject var windowGroupContent: WindowGroupContentDictionary
    @State var windowResizeInProgress = 0

    init(windowGroupContent: WindowGroupContentDictionary) {
        self.windowGroupContent = windowGroupContent
        // UpdateWebViewSystem.registerSystem()
    }

    public func setSize(size: CGSize) {
        sceneDelegate.window!.windowScene!.requestGeometryUpdate(.Vision(size: size))
    }

    func toJson(val: SIMD3<Float>) -> String {
        return "{x: " + String(val.x) + ",y: " + String(val.y) + ",z: " + String(val.z) + "}"
    }

    var dragGesture: some Gesture {
        DragGesture().handActivationBehavior(.automatic)
            .targetedToAnyEntity()
            .onChanged { value in
                let startPos = value.convert(value.startLocation3D, from: .local, to: .scene)
                let translate = value.convert(value.location3D, from: .local, to: .scene)
                let ic = value.entity.components[SpatialResource.self]!.inputComponent!
                if !ic.isDragging {
                    ic.isDragging = true
                    ic.trackedPosition = startPos
                    let delta = translate - ic.trackedPosition
                    ic.trackedPosition = translate

                    ic.wv!.fireGestureEvent(inputComponentID: ic.resourceID, data: "{eventType: 'dragstart', translate: " + toJson(val: delta) + "}")
                } else {
                    let delta = translate - ic.trackedPosition
                    ic.trackedPosition = translate
                    ic.wv!.fireGestureEvent(inputComponentID: ic.resourceID, data: "{eventType: 'dragstart', translate: " + toJson(val: delta) + "}")
                }
            }
            .onEnded { value in
                value.entity.components[SpatialResource.self]!.inputComponent!.wv!.fireGestureEvent(inputComponentID: value.entity.components[SpatialResource.self]!.inputComponent!.resourceID, data: "{eventType: 'dragend'}")
                value.entity.components[SpatialResource.self]!.inputComponent!.isDragging = false
            }
    }

    var body: some View {
        let rootWebview = windowGroupContent.childEntities.filter {
            $0.value.spatialWebView != nil && $0.value.spatialWebView?.root == true
        }.first?.value.spatialWebView
        OpenDismissHandlerUI(windowGroupContent: windowGroupContent)

        GeometryReader { proxy3D in
            ZStack {
                RealityView { _ in
                    let cube = ModelEntity()
                    cube.model = ModelComponent(mesh: .generateBox(size: 0.1), materials: [])
                    cube.generateCollisionShapes(recursive: false)
                    cube.position.x = -0.0
                    cube.position.z = 0.2
                    cube.generateCollisionShapes(recursive: false)
                    cube.components.set(InputTargetComponent())
                    // content.add(cube)

                } update: { content in
                    for (_, entity) in windowGroupContent.childEntities {
                        content.add(entity.modelEntity)
                    }
                }

                .gesture(dragGesture).offset(z: -0.1)
                if let wv = rootWebview {
                    let oval = Float(wv.scrollOffset.y)

                    // Webview content
                    ForEach(Array(windowGroupContent.childEntities.keys), id: \.self) { key in
                        let e = windowGroupContent.childEntities[key]!
                        WatchObj(toWatch: [e]) {
                            if e.spatialWebView != nil && e.spatialWebView!.inline {
                                let view = e.spatialWebView!
                                WatchObj(toWatch: [e, view]) {
                                    let x = view.full ? (proxy3D.size.width/2) : CGFloat(e.modelEntity.position.x)
                                    let y = view.full ? (proxy3D.size.height/2) : CGFloat(e.modelEntity.position.y - oval)
                                    let z = CGFloat(e.modelEntity.position.z)
                                    let width = view.full ? (proxy3D.size.width) : CGFloat(view.resolutionX)
                                    let height = view.full ? (proxy3D.size.height) : CGFloat(view.resolutionY)

                                    SpatialWebViewUI(wv: view)
                                        .frame(width: width, height: height).padding3D(.front, -100000)
                                        .position(x: x, y: y)
                                        .offset(z: z).gesture(
                                            DragGesture()
                                                .onChanged { gesture in
                                                    let scrollEnabled = view.webViewNative?.webViewHolder.appleWebView?.scrollView.isScrollEnabled
                                                    if scrollEnabled != nil, !scrollEnabled! {
                                                        if !view.dragStarted {
                                                            view.dragStarted = true
                                                            view.dragStart = (gesture.translation.height)
                                                        }

                                                        // TODO: this should have velocity
                                                        let delta = view.dragStart - gesture.translation.height
                                                        view.dragStart = gesture.translation.height
                                                        wv.webViewNative?.webViewHolder.appleWebView?.scrollView.contentOffset.y += delta
                                                    }
                                                }
                                                .onEnded { _ in
                                                    let scrollEnabled = view.webViewNative?.webViewHolder.appleWebView?.scrollView.isScrollEnabled
                                                    if scrollEnabled != nil, !scrollEnabled! {
                                                        view.dragStarted = false
                                                        view.dragStart = 0

                                                        wv.webViewNative?.webViewHolder.appleWebView?.scrollView.stopScrollingAndZooming()
                                                    }
                                                }
                                        )
                                }
                            }
                        }
                    }

                    // Mode3D content
                    ForEach(Array(windowGroupContent.childEntities.keys), id: \.self) { key in
                        let e = windowGroupContent.childEntities[key]!
                        WatchObj(toWatch: [e]) {
                            if e.modelUIComponent != nil && e.modelUIComponent?.url != nil {
                                WatchObj(toWatch: [e, e.modelUIComponent!]) {
                                    let x = CGFloat(e.modelEntity.position.x)
                                    let y = CGFloat(e.modelEntity.position.y - oval)
                                    let z = CGFloat(e.modelEntity.position.z)
                                    let width = CGFloat(e.modelUIComponent!.resolutionX)
                                    let height = CGFloat(e.modelUIComponent!.resolutionY)

                                    Model3D(url: e.modelUIComponent!.url!) { model in
                                        model.model?
                                            .resizable()
                                            .aspectRatio(contentMode: e.modelUIComponent?.aspectRatio == "fit" ? .fit : .fill)
                                    }.frame(width: width, height: height).position(x: x, y: y).offset(z: z).padding3D(.front, -100000)
                                }
                            }
                        }
                    }
                }
            }.onAppear()
                .onReceive(windowGroupContent.$setSize) { newSize in
                    setSize(size: newSize)
                }.onChange(of: proxy3D.size) {
                    // WkWebview has an issue where it doesn't resize while the swift window is resized, call didMoveToWindow to force redraw to occur
                    if windowResizeInProgress == 0 {
                        windowResizeInProgress = 1
                        Timer.scheduledTimer(withTimeInterval: 0.02, repeats: false) { _ in
                            windowResizeInProgress = 0
                            if let wv = rootWebview {
                                wv.webViewNative!.webViewHolder.appleWebView!.didMoveToWindow()
                                wv.webViewNative!.webViewHolder.appleWebView!.clearsContextBeforeDrawing = true
                            }
                        }
                    }
                }
        }
    }
}
