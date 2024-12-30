//
//  SpatialWebViewUI.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import RealityKit
import SwiftUI

// Using scrollview has some side effects so only use it on elements we want to clip the edges of
// Seems only scrollview has this clipping property so far on visionOS otherwise we would use ZStack
struct OptionalClip<Content: View>: View {
    var clipEnabled = true
    let viewBuilder: () -> Content

    var body: some View {
        if clipEnabled {
            ScrollView {
                viewBuilder()
            }.offset(z: CGFloat(0)).frame(maxWidth: .infinity, maxHeight: .infinity).scrollDisabled(true)
        } else {
            viewBuilder()
        }
    }
}

struct SpatialWebViewUI: View {
    @Environment(SpatialEntity.self) var ent: SpatialEntity
    var body: some View {
        if let wv = ent.getComponent(SpatialWindowComponent.self) {
            let parentYOffset = Float(wv.scrollOffset.y)

            let childEntities = ent.getEntities()

            // Display child entities of the webview

            ZStack {
                OptionalClip(clipEnabled: ent.coordinateSpace != .ROOT && wv.isScrollEnabled()) {
                    ZStack {
                        ForEach(Array(childEntities.keys), id: \.self) { key in
                            if let e = childEntities[key] {
                                let _ = e.forceUpdate ? 0 : 0
                                if let childWindowcomponent = e.getComponent(SpatialWindowComponent.self) {
                                    if e.coordinateSpace == .DOM {
                                        let view = childWindowcomponent
                                        let x = CGFloat(e.modelEntity.position.x)
                                        let y = CGFloat(e.modelEntity.position.y - (view.scrollWithParent ? parentYOffset : 0))
                                        let z = CGFloat(e.modelEntity.position.z)
                                        let width = CGFloat(view.resolutionX)
                                        let height = CGFloat(view.resolutionY)
                                        let anchor = view.rotationAnchor

                                        // Matrix = MTranslate X MRotate X MScale
                                        SpatialWebViewUI().environment(e)
                                            .frame(width: width, height: height)
                                            // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
                                            .offset(z: 0.0001)
                                            .scaleEffect(
                                                x: CGFloat(e.modelEntity.scale.x),
                                                y: CGFloat(e.modelEntity.scale.y),
                                                z: CGFloat(e.modelEntity.scale.z),
                                                anchor: anchor
                                            )
                                            .rotation3DEffect(
                                                Rotation3D(simd_quatf(
                                                    ix: e.modelEntity.orientation.vector.x,
                                                    iy: e.modelEntity.orientation.vector.y,
                                                    iz: e.modelEntity.orientation.vector.z,
                                                    r: e.modelEntity.orientation.vector.w
                                                )),
                                                anchor: anchor
                                            )

                                            .position(x: x, y: y)
                                            .offset(z: z)
                                            .zIndex(e.zIndex)
                                            .gesture(
                                                DragGesture()
                                                    .onChanged { gesture in
                                                        let scrollEnabled = view.isScrollEnabled()
                                                        if !scrollEnabled, wv.isScrollEnabled() {
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
                                                        if !scrollEnabled, wv.isScrollEnabled() {
                                                            view.dragStarted = false
                                                            view.dragStart = 0

                                                            wv.stopScrolling()
                                                        }
                                                    }
                                            )
                                    }
                                }
                            }
                        }

                        // SpatialView content
                        ForEach(Array(childEntities.keys), id: \.self) { key in
                            if let e = childEntities[key] {
                                if e.coordinateSpace == .DOM {
                                    if let viewComponent = e.getComponent(SpatialViewComponent.self) {
                                        let x = CGFloat(e.modelEntity.position.x)
                                        let y = CGFloat(e.modelEntity.position.y - parentYOffset)
                                        let z = CGFloat(e.modelEntity.position.z)

                                        let width = CGFloat(viewComponent.resolutionX)
                                        let height = CGFloat(viewComponent.resolutionY)

                                        SpatialViewUI().environment(e).frame(width: width, height: height).position(x: x, y: y)
                                            .offset(z: z)
                                    }
                                }
                            }
                        }
                    }.frame(maxWidth: .infinity, maxHeight: .infinity).frame(maxDepth: 0, alignment: .back).offset(z: 0)
                }

                // Display the main webview
                wv.getView()
                    .materialWithBorderCorner(
                        wv.backgroundMaterial,
                        wv.cornerRadius
                    )
                    .opacity(wv.visible ? 1 : 0)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }.hidden(!ent.visible)
        }
    }
}
