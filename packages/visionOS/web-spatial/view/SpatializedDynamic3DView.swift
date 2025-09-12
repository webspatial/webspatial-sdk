import RealityKit
import SwiftUI

struct SpatializedDynamic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @Environment(SpatialScene.self) var spatialScene: SpatialScene
    @State private var isDrag = false
    @State private var isRotate = false
    @State private var isScale = false
    
    private var spatializedDynamic3DElement: SpatializedDynamic3DElement {
        return spatializedElement as! SpatializedDynamic3DElement
    }
    
    var spatialTapEvent: some Gesture{
        SpatialTapGesture(count: 1).targetedToAnyEntity()
            .onEnded{ value in
                if let entity = value.entity as? SpatialEntity{
                    if entity.enableTap == true {
                        spatialScene.sendWebMsg(entity.spatialId, EntityTapEvent(location3D: value.location3D))
                    }
                }
        }
    }
    
    var rotate3dEvent: some Gesture{
        RotateGesture3D().targetedToAnyEntity().onChanged{ value in
            print(value.gestureValue)
            if let entity = value.entity as? SpatialEntity{
                if entity.enableTap == true {
//                    if(isRotate == false){
//                        print("start rotate")
//                    }
//                    else{
//                        print("rotating")
//                    }
//                    isRotate = true
                    return
                }
            }
            isRotate = false
        }.onEnded{ value in
            print(value.rotation)
            print("rotate end")
//            isRotate = false
        }
    }
    
    var magnifyEvent: some Gesture{
        MagnifyGesture().targetedToAnyEntity().onChanged{ value in
            print(value)
            if let entity = value.entity as? SpatialEntity{
                if entity.enableTap == true {
//                    if(isScale == false){
//                        print("start scale")
//                    }
//                    else{
//                        print("scaling")
//                    }
//                    isScale = true
                    return
                }
            }
        }.onEnded{ value in
            print("scale end")
//            isScale = false
        }
    }
    
    var dragEvent: some Gesture{
        DragGesture().targetedToAnyEntity().onChanged{ value in
            if let entity = value.entity as? SpatialEntity{
                if entity.enableTap == true {
//                    if(isDrag == false){
//                        print("start drag")
//                    }
//                    else{
//                        print("dragging")
//                    }
//                    isDrag = true
                    return
                }
            }
            
        }.onEnded{ value in
            print("drag end")
//            isDrag = false
        }
    }
    
    var body: some View {
        RealityView(make: { content in
            let rootEntity = spatializedDynamic3DElement.getRoot()
            content.add(rootEntity)
        })
        .simultaneousGesture(spatialTapEvent)
        .simultaneousGesture(rotate3dEvent)
        .simultaneousGesture(dragEvent)
        .simultaneousGesture(magnifyEvent)
    }
}

protocol EntityEventProtocol: Encodable {
    var type:String { get }
}

struct EntityTapEvent: EntityEventProtocol {
    var type: String = "tap"
    var location3D: Point3D
}
