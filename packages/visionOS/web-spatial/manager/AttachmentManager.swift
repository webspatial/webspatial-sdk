import Foundation
import simd
import SwiftUI

// Converts Euler angles in degrees to a quaternion composed as Rz·Ry·Rx,
// matching the JS SDK's composeSRT (DOMMatrix.rotate) semantics.
// simd quaternion multiplication q1 * q2 applies q2 first.
func quatFromEulerDegreesXYZ(_ deg: SIMD3<Float>) -> simd_quatf {
    let r = deg * (Float.pi / 180)
    let qx = simd_quatf(angle: r.x, axis: SIMD3<Float>(1, 0, 0))
    let qy = simd_quatf(angle: r.y, axis: SIMD3<Float>(0, 1, 0))
    let qz = simd_quatf(angle: r.z, axis: SIMD3<Float>(0, 0, 1))
    return qz * qy * qx
}

struct AttachmentInfo: Identifiable, Equatable {
    let id: String
    var parentEntityId: String
    var position: SIMD3<Float>
    var orientation: simd_quatf
    var scale: SIMD3<Float>
    var widthMeters: Double?
    var heightMeters: Double?
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
        parentEntityId: String,
        position: SIMD3<Float>,
        orientation: simd_quatf = simd_quatf(ix: 0, iy: 0, iz: 0, r: 1),
        scale: SIMD3<Float> = SIMD3<Float>(1, 1, 1),
        widthMeters: Double? = nil,
        heightMeters: Double? = nil,
        webViewModel: SpatialWebViewModel
    ) -> AttachmentInfo {
        webViewModel.setBackgroundTransparent(true)
        // webViewModel.scrollEnabled = false

        let info = AttachmentInfo(
            id: id,
            parentEntityId: parentEntityId,
            position: position,
            orientation: orientation,
            scale: scale,
            widthMeters: widthMeters,
            heightMeters: heightMeters,
            webViewModel: webViewModel
        )
        attachments[id] = info
        return info
    }

    func update(
        id: String,
        position: SIMD3<Float>?,
        orientation: simd_quatf? = nil,
        scale: SIMD3<Float>? = nil,
        widthMeters: Double? = nil,
        heightMeters: Double? = nil
    ) {
        guard var info = attachments[id] else { return }

        if let position = position {
            info.position = position
        }
        if let orientation = orientation {
            info.orientation = orientation
        }
        if let scale = scale {
            info.scale = scale
        }
        if let widthMeters = widthMeters {
            info.widthMeters = widthMeters
        }
        if let heightMeters = heightMeters {
            info.heightMeters = heightMeters
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

    func removeBatch(ids: [String]) {
        let idSet = Set(ids)
        guard !idSet.isEmpty else { return }

        let toDestroy = attachments.filter { idSet.contains($0.key) }.map { $0.value }
        guard !toDestroy.isEmpty else { return }

        attachments = attachments.filter { !idSet.contains($0.key) }

        DispatchQueue.main.async {
            for info in toDestroy {
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
