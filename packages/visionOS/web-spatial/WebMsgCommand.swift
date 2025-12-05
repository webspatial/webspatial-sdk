// All WebMsg have been listed here

import SwiftUI

enum WebSpatialGestureType: String, Encodable {
    case spatialtap = "spatialtap"
    case spatialdragstart = "spatialdragstart"
    case spatialdrag = "spatialdrag"
    case spatialdragend = "spatialdragend"
    case spatialrotatestart = "spatialrotatestart"
    case spatialrotate = "spatialrotate"
    case spatialrotateend = "spatialrotateend"
    case spatialmagnifystart = "spatialmagnifystart"
    case spatialmagnify = "spatialmagnify"
    case spatialmagnifyend = "spatialmagnifyend"
}

enum SpatialWebMsgType: String, Encodable {
    case cubeInfo = "cubeInfo"
    case transform = "transform"
    case modelloaded = "modelloaded"
    case modelloadfailed = "modelloadfailed"
    case spatialtap = "spatialtap"
    case spatialdrag = "spatialdrag"
    case spatialdragend = "spatialdragend"
    case spatialrotate = "spatialrotate"
    case spatialrotateend = "spatialrotateend"
    case spatialmagnify = "spatialmagnify"
    case spatialmagnifyend = "spatialmagnifyend"
    
    case objectdestroy = "objectdestroy"
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
    let detail: AffineTransform3D
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

struct WebSpatialRotateGuestureEventDetail: Encodable {
    let rotation: Rotation3D
    let startAnchor3D: UnitPoint3D
    let startLocation3D: Point3D
    
}
struct WebSpatialRotateGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialrotate
    let detail: WebSpatialRotateGuestureEventDetail
}

struct WebSpatialRotateEndGuestureEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.spatialrotateend
    let detail: WebSpatialRotateGuestureEventDetail
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

struct ModelLoadSuccess: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.modelloaded
}

struct ModelLoadFailure: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.modelloadfailed
}

struct SpatialObjectDestroiedEvent: Encodable {
    let type: SpatialWebMsgType = SpatialWebMsgType.objectdestroy
}
