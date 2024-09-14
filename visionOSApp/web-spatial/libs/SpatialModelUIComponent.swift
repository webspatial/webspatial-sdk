//
//  SpatialModelUIComponent.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Foundation

@Observable
class SpatialModelUIComponent: SpatialComponent {
    var url: URL? = nil
    var aspectRatio: String = "fit"
    var resolutionX: Double = 0
    var resolutionY: Double = 0

    var opacity: Double = 1
}
