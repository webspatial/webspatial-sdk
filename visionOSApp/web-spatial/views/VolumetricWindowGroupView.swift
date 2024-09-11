//
//  VolumetricWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

struct VolumetricWindowGroupView: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @Environment(SpatialWindowGroup.self) var windowGroupContent: SpatialWindowGroup

    var body: some View {
        OpenDismissHandlerUI().environment(windowGroupContent)

//        RealityView { _, _ in
//        }
//        update: { content, attachments in
//            for (_, entity) in windowGroupContent.childEntities {
//                content.add(entity.modelEntity)
//            }
//
//            for key in Array(windowGroupContent.childEntities.keys) {
//                let e = windowGroupContent.childEntities[key]!
//                let windowComponent = e.getComponent(SpatialWindowComponent.self)
//                if windowComponent != nil && e.coordinateSpace == .APP {
//                    if let glassCubeAttachment = attachments.entity(for: key) {
//                        //   glassCubeAttachment.position = e.modelEntity.position
//                        if e.modelEntity.children.count == 0 {
//                            e.modelEntity.addChild(glassCubeAttachment, preservingWorldTransform: false)
//                        }
//                    }
//                }
//            }
//        }
//        attachments: {
//            ForEach(Array(windowGroupContent.childEntities.keys), id: \.self) { _ in
//                let entity: SpatialEntity = windowGroupContent.childEntities[key]!

        //                    windowGroupContent.childEntities[key] {
//                let windowComponent = entity.getComponent(SpatialWindowComponent.self)
//                if windowComponent != nil && entity.coordinateSpace == .APP {
//                    Attachment(id: key) {
//                        let wv = windowComponent
//                        wv.getView().background(wv.glassEffect || wv.transparentEffect ? Color.clear.opacity(0) : Color.white)
//                            .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: wv.cornerRadius), displayMode: wv.glassEffect ? .always : .never)
//                            .cornerRadius(wv.cornerRadius).frame(width: wv.resolutionX, height: wv.resolutionY)
//                    }
//                }
//            }
//        }
    }
}
