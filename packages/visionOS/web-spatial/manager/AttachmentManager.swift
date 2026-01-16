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
        print("[AttachmentManager] Creating attachment \(id) for entity \(entityId)")
        // Remove any existing attachment for the same entity to avoid StrictMode duplicates
        let duplicates = attachments.filter { $0.value.entityId == entityId }
        if !duplicates.isEmpty {
            let keys = Array(duplicates.keys)
            for k in keys {
                attachments.removeValue(forKey: k)
            }
            print("[AttachmentManager] Removed duplicates for entity \(entityId): \(keys)")
        }
        let webViewModel = SpatialWebViewModel(url: nil)
        webViewModel.setBackgroundTransparent(true)

        attachments[id] = AttachmentInfo(
            id: id,
            entityId: entityId,
            anchor: anchor,
            offset: offset,
            size: size,
            webViewModel: webViewModel
        )
        print("[AttachmentManager] Attachments count: \(attachments.count)")
        print("[AttachmentManager] Attachments keys: \(Array(attachments.keys))")
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
        print("[setHTML] Setting HTML for \(id)")
        print("[setHTML] HTML: \(html)")
        guard let model = attachments[id]?.webViewModel else {
            print("[setHTML] ❌ Attachment not found!")
            return
        }
        model.loadHTML(html)
        print("[setHTML] ✓ Called loadHTML")
    }
}
