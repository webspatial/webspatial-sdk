import Foundation
import SwiftUI

struct AttachmentInfo: Identifiable, Equatable {
    let id: String
    var placementId: String
    var position: SIMD3<Float>
    var rotation: SIMD3<Float>
    var scale: SIMD3<Float>
    var frameSize: CGSize
    var webViewModel: SpatialWebViewModel

    static func == (lhs: AttachmentInfo, rhs: AttachmentInfo) -> Bool {
        lhs.id == rhs.id
    }
}

@Observable
class AttachmentManager {
    var attachments: [String: AttachmentInfo] = [:]

    // TODO: AttachmentManager.remove() dispatches destroy() asynchronously while
    // SwiftUI tears down the outgoing SpatialWebView from the RealityView's
    // ForEach. Both happen on the main queue but ordering isn't guaranteed — if
    // destroy() nils the controller before SwiftUI finishes teardown,
    // getController() re-creates it with only `model` set, missing the four
    // callback registrations from init(url:). Refactor to give attachments a
    // dedicated view path (e.g. AttachmentWebView) that doesn't depend on
    // SpatialWebViewModel's lazy re-init.
    func create(
        id: String,
        placementId: String,
        position: SIMD3<Float>,
        rotation: SIMD3<Float>,
        scale: SIMD3<Float>,
        frameSize: CGSize,
        webViewModel: SpatialWebViewModel
    ) -> AttachmentInfo {
        webViewModel.setBackgroundTransparent(true)
        // webViewModel.scrollEnabled = false

        let info = AttachmentInfo(
            id: id,
            placementId: placementId,
            position: position,
            rotation: rotation,
            scale: scale,
            frameSize: frameSize,
            webViewModel: webViewModel
        )
        attachments[id] = info
        return info
    }

    func update(
        id: String,
        position: SIMD3<Float>?,
        rotation: SIMD3<Float>?,
        scale: SIMD3<Float>?,
        frameSize: CGSize?
    ) {
        guard var info = attachments[id] else { return }

        if let position = position {
            info.position = position
        }
        if let rotation = rotation {
            info.rotation = rotation
        }
        if let scale = scale {
            info.scale = scale
        }
        if let frameSize = frameSize {
            info.frameSize = frameSize
        }

        attachments[id] = info
    }

    func remove(id: String) {
        if let info = attachments.removeValue(forKey: id) {
            DispatchQueue.main.async {
                info.webViewModel.destroy()
            }
        }
    }

    func get(id: String) -> AttachmentInfo? {
        attachments[id]
    }

    func destroyAll() {
        let toDestroy = Array(attachments.values)
        attachments.removeAll()

        DispatchQueue.main.async {
            for info in toDestroy {
                info.webViewModel.destroy()
            }
        }
    }
}
