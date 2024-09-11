//
//  SpatialComponent.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Foundation

class SpatialComponent: SpatialObject {
    weak var entity: SpatialEntity? = nil

    func onAddToEntity() {}
}
