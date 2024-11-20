//
//  SpatialViewUI.swift
//  web-spatial
//
//  Created by ByteDance on 11/6/24.
//
import RealityKit
import SwiftUI

struct SpatialViewUI: View {
    @Environment(SpatialEntity.self) var ent: SpatialEntity

    // Entity which will contain all the content of this realityView and scale to fit frame
    @State var world = Entity()

    var body: some View {
        if let viewComponent = ent.getComponent(SpatialViewComponent.self) {
            GeometryReader3D { proxy in
                // Get dimensions of the frame
                let proxySize3d = proxy.frame(in: .local)

                RealityView { _, _ in
                } update: { content, attachments in
                    // Scale content so it will be a 1x1x1 space and not exceed the frame
                    let viewSpaceDimensions = content.convert(proxySize3d, from: .local, to: content)
                    var newScale = min(viewSpaceDimensions.extents.x, viewSpaceDimensions.extents.y)
                    world.transform.scale.x = newScale
                    world.transform.scale.y = newScale
                    world.transform.scale.z = newScale

                    // Pull out content so volume sits in front of the page
                    world.transform.translation.z = world.transform.scale.z / 2

                    for (_, entity) in ent.getEntities() {
                        world.addChild(entity.modelEntity)
                    }

                    // Add attachments for window entities
                    let entities = ent.getEntities().filter { _, entity in
                        entity.coordinateSpace == .APP && entity.hasComponent(SpatialWindowComponent.self)
                    }
                    for key in Array(entities.keys) {
                        let e = entities[key]!
                        let windowComponent = e.getComponent(SpatialWindowComponent.self)
                        if windowComponent != nil && e.coordinateSpace == .APP {
                            if let windowAttachment = attachments.entity(for: key) {
                                if e.modelEntity.children.count == 0 {
                                    e.modelEntity.addChild(windowAttachment, preservingWorldTransform: false)
                                }
                            }
                        }
                    }
                    content.add(world)
                }
                attachments: {
                    // Create an attachment for each window component
                    let entities = ent.getEntities().filter { _, entity in
                        entity.coordinateSpace == .APP && entity.hasComponent(SpatialWindowComponent.self)
                    }
                    ForEach(Array(entities.keys), id: \.self) { key in
                        let entity = entities[key]!
                        let wv = entity.getComponent(SpatialWindowComponent.self)!
                        Attachment(id: key) {
                            SpatialWebViewUI().environment(entity).frame(width: wv.resolutionX, height: wv.resolutionY)
                        }
                    }
                }.clipped()
            }
        }
    }
}
