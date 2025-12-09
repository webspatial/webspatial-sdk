import Foundation
import SwiftUI

@Observable
class SpatializedStatic3DElement: SpatializedElement {
    var modelURL: String = ""
    var modelTransform: AffineTransform3D = .identity
    var animationAutoplay: Bool = false
    var animationLoop: Bool = false
    var animationPaused: Bool = true
    var animationDuration: Double = 0
    var animationCurrentTime: Double = 0
    var animationPlaybackRate: Double = 1

    enum CodingKeys: String, CodingKey {
        case modelURL, type
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(modelURL, forKey: .modelURL)
        try container.encode(SpatializedElementType.SpatializedStatic3DElement, forKey: .type)
    }
}
