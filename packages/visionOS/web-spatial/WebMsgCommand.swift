// All WebMsg have been listed here

import SwiftUI

enum WebSpatialGestureType: String, Encodable {
    case spatialtap
    case spatialdragstart
    case spatialdrag
    case spatialdragend
    case spatialrotate
    case spatialrotateend
    case spatialmagnify
    case spatialmagnifyend
}

enum SpatialWebMsgType: String, Encodable {
    case modelloaded
    case modelloadfailed
    case spatialtap
    case spatialdragstart
    case spatialdrag
    case spatialdragend
    case spatialrotate
    case spatialrotateend
    case spatialmagnify
    case spatialmagnifyend
    case animationstatechange
    case entitytransformchange
    case objectdestroy
}

struct WebSpatialTapGuestureEventDetail: Encodable {
    let location3D: Point3D
    /// Global scene location (maps to clientX/clientY/clientZ on the web side).
    let globalLocation3D: Point3D?
}

/// notify SpatializedElement/SpatialEntity tapped
struct WebSpatialTapGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialtap
    let detail: WebSpatialTapGuestureEventDetail
}

struct WebSpatialDragStartGuestureEventDetail: Encodable {
    let startLocation3D: Point3D
    /// Global scene location for the drag start point.
    let globalLocation3D: Point3D?
}

struct WebSpatialDragStartGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialdragstart
    let detail: WebSpatialDragStartGuestureEventDetail
}

struct WebSpatialDragGuestureEventDetail: Encodable {
    let translation3D: Vector3D
}

struct WebSpatialDragGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialdrag
    let detail: WebSpatialDragGuestureEventDetail
}

struct WebSpatialDragEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialdragend
}

struct Quaternion: Encodable {
    let x: Double
    let y: Double
    let z: Double
    let w: Double
}

struct WebSpatialRotateGuestureEventDetail: Encodable {
    let quaternion: Quaternion
}

struct WebSpatialRotateGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialrotate
    let detail: WebSpatialRotateGuestureEventDetail
}

struct WebSpatialRotateEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialrotateend
}

struct WebSpatialMagnifyGuestureEventDetail: Encodable {
    let magnification: CGFloat
}

struct WebSpatialMagnifyGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialmagnify
    let detail: WebSpatialMagnifyGuestureEventDetail
}

struct WebSpatialMagnifyEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialmagnifyend
}

struct ModelLoadSuccessDetail: Encodable {
    let src: String
}

struct ModelLoadSuccess: Encodable {
    let type: SpatialWebMsgType = .modelloaded
    let detail: ModelLoadSuccessDetail

    init(src: String) {
        detail = ModelLoadSuccessDetail(src: src)
    }
}

struct ModelLoadFailure: Encodable {
    let type: SpatialWebMsgType = .modelloadfailed
}

struct AnimationStateChangeDetail: Encodable {
    let paused: Bool
    let duration: Double
    let currentTime: Double
    /// Unix epoch time in milliseconds
    let timestamp: Double
}

struct AnimationStateChangeEvent: Encodable {
    let type: SpatialWebMsgType = .animationstatechange
    let detail: AnimationStateChangeDetail
}

/// 16-element column-major representation of the new `entityTransform`,
/// matching the wire format that JS already uses when sending the matrix to
/// native via `UpdateSpatializedStatic3DElementProperties.modelTransform`.
struct EntityTransformChangeDetail: Encodable {
    let transform: [Double]
}

struct EntityTransformChangeEvent: Encodable {
    let type: SpatialWebMsgType = .entitytransformchange
    let detail: EntityTransformChangeDetail

    /// Emits the transform to the web layer as a 16-element column-major matrix.
    init(_ transform: AffineTransform3D) {
        let m = transform.matrix
        let c0 = m.columns.0, c1 = m.columns.1, c2 = m.columns.2, c3 = m.columns.3
        let array: [Double] = [
            c0.x, c0.y, c0.z, 0,
            c1.x, c1.y, c1.z, 0,
            c2.x, c2.y, c2.z, 0,
            c3.x, c3.y, c3.z, 1,
        ]
        detail = EntityTransformChangeDetail(transform: array)
    }
}

struct SpatialObjectDestroiedEvent: Encodable {
    let type: SpatialWebMsgType = .objectdestroy
}
