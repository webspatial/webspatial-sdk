//
//  SpatialModelComponent.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Combine
import Foundation
import RealityKit

@Observable
class SpatialModelComponent: SpatialComponent {
    var modelComponent: ModelComponent

    init(_ modelComponent: ModelComponent) {
        self.modelComponent = modelComponent

        super.init()
    }

    override func onAddToEntity() {
        entity?.modelEntity.model = modelComponent
    }
}
