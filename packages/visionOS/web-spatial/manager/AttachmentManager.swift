import Foundation
import SwiftUI

struct AttachmentInfo: Identifiable, Equatable {
    let id: String
    var parentEntityId: String
    var position: SIMD3<Float>
    var size: CGSize
    var webViewModel: SpatialWebViewModel

    static func == (lhs: AttachmentInfo, rhs: AttachmentInfo) -> Bool {
        return lhs.id == rhs.id
    }
}

@Observable
class AttachmentManager {
    var attachments: [String: AttachmentInfo] = [:]

    func create(
        id: String,
        parentEntityId: String,
        position: SIMD3<Float>,
        size: CGSize
    ) -> AttachmentInfo {
        let webViewModel = SpatialWebViewModel(url: nil)
        webViewModel.setBackgroundTransparent(true)
        webViewModel.scrollEnabled = false

        let info = AttachmentInfo(
            id: id,
            parentEntityId: parentEntityId,
            position: position,
            size: size,
            webViewModel: webViewModel
        )
        attachments[id] = info
        return info
    }

    func update(id: String, position: SIMD3<Float>?, size: CGSize?) {
        guard var info = attachments[id] else { return }
        if let position = position {
            info.position = position
        }
        if let size = size {
            info.size = size
        }
        attachments[id] = info
    }

    func remove(id: String) {
        if let info = attachments.removeValue(forKey: id) {
            info.webViewModel.destroy()
        }
    }

    func get(id: String) -> AttachmentInfo? {
        return attachments[id]
    }

    func destroyAll() {
        for (_, info) in attachments {
            info.webViewModel.destroy()
        }
        attachments.removeAll()
    }
}
