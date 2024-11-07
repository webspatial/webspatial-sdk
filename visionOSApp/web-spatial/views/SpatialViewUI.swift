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
    var body: some View {
        if let viewComponent = ent.getComponent(SpatialViewComponent.self) {
            RealityView { _ in
            } update: { content in
                for (_, entity) in ent.getEntities() {
                    content.add(entity.modelEntity)
                }
            }
        }
    }
}
