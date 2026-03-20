import Foundation
import SwiftUI

private let USDZ_MIME_TYPE = "model/vnd.usdz+zip"

struct ModelSource: Equatable {
    let src: String
    let type: String?
}

@Observable
class SpatializedStatic3DElement: SpatializedElement {
    var modelURL: String = ""
    var sources: [ModelSource] = []
    var modelTransform: AffineTransform3D = .identity
    var autoplay: Bool = false
    var loop: Bool = false
    var animationPaused: Bool = true
    var playbackRate: Double = 1.0
    var allSources: [ModelSource] {
        let usdz = sources.filter { $0.type == USDZ_MIME_TYPE }
        let rest = sources.filter { $0.type != USDZ_MIME_TYPE }
        return [ModelSource(src: modelURL, type: nil)] + usdz + rest
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
