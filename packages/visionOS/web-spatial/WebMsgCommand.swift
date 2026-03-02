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
    case cubeInfo
    case transform
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

    case objectdestroy
}

// notify Spatialized3DElement Container Cube, used for ref.current.getBoundingClientCube()
struct SpatiaizedContainerClientCube: Encodable {
    let type: SpatialWebMsgType = .cubeInfo
    let origin: Point3D
    let size: Size3D
}

// notify Spatialized3DElement Container Transform to SpatialScene, used for ref.current.convertToSpatialScene()
struct SpatiaizedContainerTransform: Encodable {
    let type: SpatialWebMsgType = .transform
    let detail: AffineTransform3D
}

struct WebSpatialTapGuestureEventDetail: Encodable {
    let location3D: Point3D
    // Global scene location (maps to clientX/clientY/clientZ on the web side).
    let globalLocation3D: Point3D?
}

// notify SpatializedElement/SpatialEntity tapped
struct WebSpatialTapGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialtap
    let detail: WebSpatialTapGuestureEventDetail
}

struct WebSpatialDragStartGuestureEventDetail: Encodable {
    let startLocation3D: Point3D
    // Global scene location for the drag start point.
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

struct ModelLoadSuccess: Encodable {
    let type: SpatialWebMsgType = .modelloaded
}

struct ModelLoadFailure: Encodable {
    let type: SpatialWebMsgType = .modelloadfailed
}

struct SpatialObjectDestroiedEvent: Encodable {
    let type: SpatialWebMsgType = .objectdestroy
}
