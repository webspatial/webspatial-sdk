// All WebMsg have been listed here

import SwiftUI

enum SpatialWebMsgType: String, Encodable {
    case cubeInfo = "cubeInfo"
    case transform = "transform"
    case spatialtap = "spatialtap"
    case spatialdrag = "spatialdrag"
    case spatialdragend = "spatialdragend"
    case spatialrotation = "spatialrotation"
    case spatialrotationend = "spatialrotationend"
    case spatialmagnify = "spatialmagnify"
    case spatialmagnifyend = "spatialmagnifyend"
}

// notify Spatialized3DElement Container Cube, used for ref.current.getBoundingClientCube()
struct SpatiaizedContainerClientCube: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.cubeInfo
    let origin: Point3D
    let size: Size3D
}

// notify Spatialized3DElement Container Transform to SpatialScene, used for ref.current.convertToSpatialScene()
struct SpatiaizedContainerTransform: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.transform
}

struct WebSpatialTapGuestureEventDetail: Encodable {
    let location3D: Point3D
}

// notify SpatializedElement/SpatialEntity tapped
struct WebSpatialTapGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialtap
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
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialdrag
    let detail: WebSpatialDragGuestureEventDetail
}

struct WebSpatialDragEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialdragend
    let detail: WebSpatialDragGuestureEventDetail
}

struct WebSpatialRotationGuestureEventDetail: Encodable {
    let rotation: Rotation3D
    let startAnchor3D: UnitPoint3D
    let startLocation3D: Point3D
    
}
struct WebSpatialRotationGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialrotation
    let detail: WebSpatialRotationGuestureEventDetail
}

struct WebSpatialRotationEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialrotationend
    let detail: WebSpatialRotationGuestureEventDetail
}

struct WebSpatialMagnifyGuestureEventDetail: Encodable {
    let magnification: CGFloat
    let velocity: CGFloat
    let startLocation3D: Point3D
    let startAnchor3D: UnitPoint3D
}

struct WebSpatialMagnifyGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialmagnify
    let detail: WebSpatialMagnifyGuestureEventDetail
}

struct WebSpatialMagnifyEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialmagnifyend
    let detail: WebSpatialMagnifyGuestureEventDetail
}
