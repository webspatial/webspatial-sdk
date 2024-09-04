//
//  PlainWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import RealityKit
import SwiftUI

struct SpatialWebViewUI: View {
    @Environment(SpatialResource.self) var ent: SpatialResource
    var body: some View {
        if let wv = ent.spatialWebView {
            wv.getView()
                .background(wv.glassEffect || wv.transparentEffect ? Color.clear.opacity(0) : Color.white)
                .background(
                    wv.materialThickness.opacity(wv.useMaterialThickness ? 1.0 : 0.0)
                )
                .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: wv.cornerRadius), displayMode: wv.glassEffect ? .always : .never)
                .cornerRadius(wv.cornerRadius)
                .opacity(wv.visible ? 1 : 0)
            
            let parentYOffset = Float(wv.scrollOffset.y)

            ForEach(Array(ent.childEntities.keys), id: \.self) { key in
                if let e = ent.childEntities[key] {
                    let _ = e.forceUpdate ? 0 : 0
                    if e.spatialWebView != nil && e.coordinateSpace == .DOM {
                        let view = e.spatialWebView!
                        let x = CGFloat(e.modelEntity.position.x)
                        let y = CGFloat(e.modelEntity.position.y - (e.spatialWebView!.scrollWithParent ? parentYOffset : 0))
                        let z = CGFloat(e.modelEntity.position.z)
                        let width = CGFloat(view.resolutionX)
                        let height = CGFloat(view.resolutionY)
                        
                        SpatialWebViewUI().environment(e)
                            .frame(width: width, height: height).padding3D(.front, -100000)
                            .rotation3DEffect(Rotation3D(simd_quatf(ix: e.modelEntity.orientation.vector.x, iy: e.modelEntity.orientation.vector.y, iz: e.modelEntity.orientation.vector.z, r: e.modelEntity.orientation.vector.w)))
                            .position(x: x, y: y)
                            .offset(z: z)
                            .gesture(
                                DragGesture()
                                    .onChanged { gesture in
                                        let scrollEnabled = view.isScrollEnabled()
                                        if !scrollEnabled {
                                            if !view.dragStarted {
                                                view.dragStarted = true
                                                view.dragStart = (gesture.translation.height)
                                            }
                                            
                                            // TODO: this should have velocity
                                            let delta = view.dragStart - gesture.translation.height
                                            view.dragStart = gesture.translation.height
                                            wv.updateScrollOffset(delta: delta)
                                        }
                                    }
                                    .onEnded { _ in
                                        let scrollEnabled = view.isScrollEnabled()
                                        if !scrollEnabled {
                                            view.dragStarted = false
                                            view.dragStart = 0
                                            
                                            wv.stopScrolling()
                                        }
                                    }
                            )
                    }
                }
            }

            // Mode3D content
            ForEach(Array(ent.childEntities.keys), id: \.self) { key in
                if let e = ent.childEntities[key] {
                    if let modelUIComponent = e.modelUIComponent, let modelUrl = e.modelUIComponent?.url {
                        let x = CGFloat(e.modelEntity.position.x)
                        let y = CGFloat(e.modelEntity.position.y - parentYOffset)
                        let z = CGFloat(e.modelEntity.position.z)
                        
                        let scaleX = e.modelEntity.scale.x
                        let scaleY = e.modelEntity.scale.y
                        
                        let width = CGFloat(modelUIComponent.resolutionX) * CGFloat(scaleX)
                        let height = CGFloat(modelUIComponent.resolutionY) * CGFloat(scaleY)
                        Model3D(url: modelUrl) { model in
                            model.model?
                                .resizable()
                                .aspectRatio(contentMode: e.modelUIComponent?.aspectRatio == "fit" ? .fit : .fill)
                        }
                        .frame(width: width, height: height)
                        .position(x: x, y: y)
                        .offset(z: z)
                        .padding3D(.front, -100000)
                        .opacity(modelUIComponent.opacity)
                    }
                }
            }
        }
    }
}

struct PlainWindowGroupView: View {
    @EnvironmentObject private var sceneDelegate: SceneDelegate
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(\.dismissWindow) private var dismissWindow
    @Environment(WindowGroupContentDictionary.self) var windowGroupContent: WindowGroupContentDictionary
    
    @State var windowResizeInProgress = false
    @State var timer: Timer?
    
    public func setSize(size: CGSize) {
        sceneDelegate.window?.windowScene?.requestGeometryUpdate(.Vision(size: size))
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
            $0.value.spatialWebView != nil && $0.value.coordinateSpace == .ROOT
        }.first?.value.spatialWebView
        
        OpenDismissHandlerUI().environment(windowGroupContent)
        
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
                }.opacity(windowResizeInProgress ? 0 : 1)
                    .gesture(dragGesture).offset(z: -0.1)
                
                if let wv = rootWebview {
                    let parentYOffset = Float(wv.scrollOffset.y)
                    
                    // Webview content
                    ForEach(Array(windowGroupContent.childEntities.keys), id: \.self) { key in
                        if let e = windowGroupContent.childEntities[key] {
                            let _ = e.forceUpdate ? 0 : 0
                            if e.spatialWebView != nil && (e.coordinateSpace == .ROOT) {
                                let view = e.spatialWebView!
                                let x = e.coordinateSpace == .ROOT ? (proxy3D.size.width/2) : CGFloat(e.modelEntity.position.x)
                                let y = e.coordinateSpace == .ROOT ? (proxy3D.size.height/2) : CGFloat(e.modelEntity.position.y - (e.spatialWebView!.scrollWithParent ? parentYOffset : 0))
                                let z = CGFloat(e.modelEntity.position.z)
                                let width = e.coordinateSpace == .ROOT ? (proxy3D.size.width) : CGFloat(view.resolutionX)
                                let height = e.coordinateSpace == .ROOT ? (proxy3D.size.height) : CGFloat(view.resolutionY)
                                
                                if windowResizeInProgress && e.coordinateSpace == .ROOT {
                                    VStack {}.frame(width: width, height: height).glassBackgroundEffect().padding3D(.front, -100000)
                                        .position(x: x, y: y)
                                        .offset(z: z)
                                }
                                if !windowResizeInProgress {
                                    SpatialWebViewUI().environment(e)
                                        .frame(width: width, height: height).padding3D(.front, -100000)
                                        .rotation3DEffect(Rotation3D(simd_quatf(ix: e.modelEntity.orientation.vector.x, iy: e.modelEntity.orientation.vector.y, iz: e.modelEntity.orientation.vector.z, r: e.modelEntity.orientation.vector.w)))
                                        .position(x: x, y: y)
                                        .offset(z: z)
                                        .opacity(windowResizeInProgress ? 0 : 1)
                                }
                            }
                        }
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
                if let wv = rootWebview {
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
