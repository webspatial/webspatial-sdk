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
    @Environment(SpatialWindowGroup.self) var windowGroupContent: SpatialWindowGroup

    var body: some View {
        OpenDismissHandlerUI().environment(windowGroupContent)

        RealityView { _, _ in
//            print("gu")
        }
        update: { content, attachments in
            let entities = windowGroupContent.getEntities()
            for (_, entity) in entities {
                content.add(entity.modelEntity)
            }

            for key in Array(entities.keys) {
                let e = entities[key]!
                let windowComponent = e.getComponent(SpatialWindowComponent.self)
                if windowComponent != nil && e.coordinateSpace == .APP {
                    if let glassCubeAttachment = attachments.entity(for: key) {
                        //   glassCubeAttachment.position = e.modelEntity.position
                        if e.modelEntity.children.count == 0 {
                            e.modelEntity.addChild(glassCubeAttachment, preservingWorldTransform: false)
                        }
                    }
                }
            }
        }
        attachments: {
            let entities = windowGroupContent.getEntities().filter { _, entity in
                entity.coordinateSpace == .APP && entity.hasComponent(SpatialWindowComponent.self)
            }

            ForEach(Array(entities.keys), id: \.self) { key in
                let entity = entities[key]!
                let wv = entity.getComponent(SpatialWindowComponent.self)!
                Attachment(id: key) {
                    wv.getView()
                        .background(wv.glassEffect || wv.transparentEffect ? Color.clear.opacity(0) : Color.white)
                        .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: wv.cornerRadius), displayMode: wv.glassEffect ? .always : .never)
                        .cornerRadius(wv.cornerRadius).frame(width: wv.resolutionX, height: wv.resolutionY)
                }
            }
        }
    }
}
