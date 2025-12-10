// All WebMsg have been listed here

import SwiftUI

enum WebSpatialGestureType: String, Encodable {
    case spatialtap
    case spatialdragstart
    case spatialdrag
    case spatialdragend
    case spatialrotatestart
    case spatialrotate
    case spatialrotateend
    case spatialmagnifystart
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
    case spatialrotatestart
    case spatialrotate
    case spatialrotateend
    case spatialmagnifystart
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
}

// notify SpatializedElement/SpatialEntity tapped
struct WebSpatialTapGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialtap
    let detail: WebSpatialTapGuestureEventDetail
}

struct WebSpatialDragGuestureEventDetail: Encodable {
    let location3D: Point3D
    let startLocation3D: Point3D
    let translation3D: Vector3D
    let predictedEndTranslation3D: Vector3D
    let predictedEndLocation3D: Point3D
    let velocity: CGSize
}

struct WebSpatialDragGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialdrag
    let detail: WebSpatialDragGuestureEventDetail
}

struct WebSpatialDragStartGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialdragstart
    let detail: WebSpatialDragGuestureEventDetail
}

struct WebSpatialDragEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialdragend
    let detail: WebSpatialDragGuestureEventDetail
}

struct WebSpatialRotateGuestureEventDetail: Encodable {
    let rotation: Rotation3D
    let startAnchor3D: UnitPoint3D
    let startLocation3D: Point3D
}

struct WebSpatialRotateGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialrotate
    let detail: WebSpatialRotateGuestureEventDetail
}

struct WebSpatialRotateStartGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialrotatestart
    let detail: WebSpatialRotateGuestureEventDetail
}

struct WebSpatialRotateEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialrotateend
    let detail: WebSpatialRotateGuestureEventDetail
}

struct WebSpatialMagnifyGuestureEventDetail: Encodable {
    let magnification: CGFloat
    let velocity: CGFloat
    let startLocation3D: Point3D
    let startAnchor3D: UnitPoint3D
}

struct WebSpatialMagnifyGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialmagnify
    let detail: WebSpatialMagnifyGuestureEventDetail
}

struct WebSpatialMagnifyStartGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialmagnifystart
    let detail: WebSpatialMagnifyGuestureEventDetail
}

struct WebSpatialMagnifyEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = .spatialmagnifyend
    let detail: WebSpatialMagnifyGuestureEventDetail
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
