// All WebMsg have been listed here

import SwiftUI

// notify Spatialized3DElement Container Cube, used for ref.current.getBoundingClientCube()
struct SpatiaizedContainerClientCube: Encodable {
    let type: String = "cubeInfo"
    let origin: Point3D
    let size: Size3D
}

// notify Spatialized3DElement Container Transform to SpatialScene, used for ref.current.convertToSpatialScene()
struct SpatiaizedContainerTransform: Encodable {
    let type: String = "transform"
}

struct WebSpatialTapGuestureEventDetail: Encodable {
    let location3D: Point3D
}

// notify SpatializedElement/SpatialEntity tapped
struct WebSpatialTapGuestureEvent: Encodable {
    let type: String = "spatialtap"
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

// notify SpatializedElement/SpatialEntity dragging
struct WebSpatialDragGuestureEvent: Encodable {
    let type: String = "spatialdrag"
    let detail: WebSpatialDragGuestureEventDetail
}

// notify SpatializedElement/SpatialEntity dragging end
struct WebSpatialDragEndGuestureEvent: Encodable {
    let type: String = "spatialdragend"
    let detail: WebSpatialDragGuestureEventDetail
    
}

