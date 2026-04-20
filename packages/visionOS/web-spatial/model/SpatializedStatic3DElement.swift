import Foundation
import SwiftUI

struct ModelSource: Codable, Equatable {
    let src: String
    let type: String?
}

@Observable
class SpatializedStatic3DElement: SpatializedElement {
    var modelURL: String?
    var sources: [ModelSource] = []
    var modelTransform: AffineTransform3D = .identity
    var autoplay: Bool = false
    var loop: Bool = false
    var animationPaused: Bool = true
    var playbackRate: Double = 1.0
    /// Requested seek position in seconds. Setting it triggers a seek in
    /// `SpatializedStatic3DView`, which clears it back to `nil`.
    var pendingSeekTime: Double?
    var posterURL: String?
    var allSources: [ModelSource] {
        return if let modelURL {
            [ModelSource(src: modelURL, type: nil)] + sources
        } else { sources }
    }

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
