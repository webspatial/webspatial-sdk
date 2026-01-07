import Observation
import RealityKit
import SwiftUI

struct AttachmentInfo: Identifiable {
    let id: String
    let entityId: String
    var anchor: SIMD3<Float>
    var offset: SIMD3<Float>
    var size: CGSize
    let webViewModel: SpatialWebViewModel
}

@Observable
class AttachmentManager {
    var attachments: [String: AttachmentInfo] = [:]

    func create(id: String, entityId: String, anchor: SIMD3<Float>, offset: SIMD3<Float>, size: CGSize) {
        let webViewModel = SpatialWebViewModel(url: nil)

        attachments[id] = AttachmentInfo(
            id: id,
            entityId: entityId,
            anchor: anchor,
            offset: offset,
            size: size,
            webViewModel: webViewModel
        )
    }

    func update(id: String, offset: SIMD3<Float>?, size: CGSize?) {
        guard var info = attachments[id] else { return }
        if let offset = offset { info.offset = offset }
        if let size = size { info.size = size }
        attachments[id] = info
    }

    func destroy(id: String) {
        attachments.removeValue(forKey: id)
    }

    func getWebViewModel(for id: String) -> SpatialWebViewModel? {
        return attachments[id]?.webViewModel
    }

    func setHTML(id: String, html: String) {
        guard let model = attachments[id]?.webViewModel else { return }
        model.loadHTML(html)
    }
}
