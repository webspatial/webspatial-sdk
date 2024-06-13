//
//  PlainWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import RealityKit
import SwiftUI

// Helper view to tell swiftui to watch a certain object without needing to create another view
struct WatchObj<T: ObservableObject, Content: View>: View {
    @ObservedObject var toWatch: T
    var content: () -> Content

    init(toWatch: T, @ViewBuilder content: @escaping () -> Content) {
        self.content = content
        self.toWatch = toWatch
    }

    var body: some View {
        VStack(content: content)
    }
}

struct SpatialWebViewUI: View {
    @ObservedObject var wv: SpatialWebView

    var body: some View {
        wv.webViewNative
            .background(wv.glassEffect ? Color.clear.opacity(0) : Color.white)
            .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: wv.cornerRadius), displayMode: wv.glassEffect ? .always : .never)
            .cornerRadius(wv.cornerRadius)
            .opacity(wv.visible ? 1 : 0)
    }
}

struct PlainWindowGroupView: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @ObservedObject var windowGroupContent: WindowGroupContentDictionary
    @State var windowResizeInProgress = 0

    init(windowGroupContent: WindowGroupContentDictionary) {
        self.windowGroupContent = windowGroupContent
        // UpdateWebViewSystem.registerSystem()
    }

    var dragGesture: some Gesture {
        DragGesture()
            .targetedToAnyEntity()
            .onChanged { value in
                //  value.entity.position.x = Float(value.location3D.x)
                //  print(value.entity.name + "test")
                // value.entity.position = value.convert(value.location3D, from: .local, to: value.entity.parent!)

                // var p = value.convert(value.location3D, from: .local, to: value.entity.parent!)

                var x = Transform()
                x.translation.x = value.entity.position.x < 0 ? 0.4 : -0.4
                // x.translation = p

                value.entity.move(to: x, relativeTo: nil, duration: 10.0)
            }
    }

    var body: some View {
        let wv = windowGroupContent.entities.filter { $0.value.spatialWebView != nil && $0.value.spatialWebView?.root == true }.first!.value.spatialWebView!
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
        }

        GeometryReader { proxy3D in
            ZStack {
                RealityView { _ in
                    //    let cube = ModelEntity()
                    //    cube.model = ModelComponent(mesh: .generateBox(size: 0.1), materials: [])
                    //    cube.generateCollisionShapes(recursive: false)
                    //    cube.position.x = -0.5
                    //    cube.position.z = 0.2
                    //    cube.generateCollisionShapes(recursive: false)
                    //    cube.components.set(InputTargetComponent())
                    //    content.add(cube)

                } update: { content in
                    for (_, entity) in windowGroupContent.entities {
                        content.add(entity.modelEntity)
                    }
                }

                .gesture(dragGesture).offset(z: -0.1)

                let oval = Float(wv.scrollOffset.y)

                // Webview content
                ForEach(Array(windowGroupContent.entities.keys), id: \.self) { key in
                    let e = windowGroupContent.entities[key]!
                    WatchObj(toWatch: e) {
                        if e.spatialWebView != nil && e.spatialWebView!.inline {
                            let view = e.spatialWebView!
                            WatchObj(toWatch: view) {
                                let x = view.full ? (proxy3D.size.width/2) : CGFloat(e.modelEntity.position.x)
                                let y = view.full ? (proxy3D.size.height/2) : CGFloat(e.modelEntity.position.y - oval)
                                let z = CGFloat(e.modelEntity.position.z)
                                let width = view.full ? (proxy3D.size.width) : CGFloat(view.resolutionX)
                                let height = view.full ? (proxy3D.size.height) : CGFloat(view.resolutionY)

                                SpatialWebViewUI(wv: view)
                                    .frame(width: width, height: height).padding3D(.front, -100000)
                                    .position(x: x, y: y)
                                    .offset(z: z)
                            }
                        }
                    }
                }

                // Mode3D content
                ForEach(Array(windowGroupContent.entities.keys), id: \.self) { key in
                    let e = windowGroupContent.entities[key]!
                    WatchObj(toWatch: e) {
                        if e.modelUIComponent != nil && e.modelUIComponent?.url != nil {
                            WatchObj(toWatch: e.modelUIComponent!) {
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
            }.onChange(of: proxy3D.size) {
                // WkWebview has an issue where it doesn't resize while the swift window is resized, call didMoveToWindow to force redraw to occur
                if windowResizeInProgress == 0 {
                    windowResizeInProgress = 1
                    Timer.scheduledTimer(withTimeInterval: 0.02, repeats: false) { _ in
                        windowResizeInProgress = 0
                        wv.webViewNative!.webViewHolder.appleWebView!.didMoveToWindow()
                        wv.webViewNative!.webViewHolder.appleWebView!.clearsContextBeforeDrawing = true
                    }
                }
            }
        }
    }
}
