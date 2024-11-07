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

                RealityView { _ in
                } update: { content in
                    // Scale content so it will be a 1x1x1 space and not exceed the frame
                    let viewSpaceDimensions = content.convert(proxySize3d, from: .local, to: content)
                    var newScale = min(viewSpaceDimensions.extents.x, viewSpaceDimensions.extents.y)
                    world.transform.scale.x = newScale
                    world.transform.scale.y = newScale
                    world.transform.scale.z = newScale

                    for (_, entity) in ent.getEntities() {
                        world.addChild(entity.modelEntity)
                    }
                    content.add(world)
                }.clipped()
            }
        }
    }
}
