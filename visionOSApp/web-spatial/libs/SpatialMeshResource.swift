//
//  SpatialObject.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Foundation
import RealityKit

@Observable
class SpatialMeshResource: SpatialObject {
    let meshResource: MeshResource

    init(_ meshResource: MeshResource) {
        self.meshResource = meshResource
        super.init()
    }
}
