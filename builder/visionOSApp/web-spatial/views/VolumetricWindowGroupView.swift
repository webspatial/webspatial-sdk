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

        let entities = windowGroupContent.getEntities().filter { _, entity in
            entity.coordinateSpace == .ROOT && entity.hasComponent(SpatialViewComponent.self)
        }

        ForEach(Array(entities.keys), id: \.self) { key in
            let entity = entities[key]!
            SpatialViewUI(isRoot: true).environment(entity)
        }
    }
}
