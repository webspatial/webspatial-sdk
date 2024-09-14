//
//  SpatialPhysicallyBasedMaterial.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Foundation
import RealityKit

@Observable
class SpatialPhysicallyBasedMaterial: SpatialObject {
    var physicallyBasedMaterial: PhysicallyBasedMaterial

    init(_ physicallyBasedMaterial: PhysicallyBasedMaterial) {
        self.physicallyBasedMaterial = physicallyBasedMaterial
        super.init()
    }
}
