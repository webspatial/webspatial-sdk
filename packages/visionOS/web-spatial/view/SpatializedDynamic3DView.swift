import RealityKit
import SwiftUI

struct SpatializedDynamic3DView: View {
    @Environment(SpatializedElement.self) var spatializedElement: SpatializedElement
    @State private var isDrag = false
    @State private var isRotate = false
    @State private var isScale = false
    
    private var spatializedDynamic3DElement: SpatializedDynamic3DElement {
        return spatializedElement as! SpatializedDynamic3DElement
    }
    
    var spatialTapEvent: some Gesture{
        SpatialTapGesture(count: 1).targetedToAnyEntity()
            .onEnded{ value in
                
        }
    }
    
    var rotate3dEvent: some Gesture{
        RotateGesture3D().targetedToAnyEntity().onChanged{ value in
            print(value.gestureValue)
            if(isRotate == false){
                print("start rotate")
            }
            else{
                print("rotating")
            }
            isRotate = true
        }.onEnded{ value in
            print(value.rotation)
            print("rotate end")
            isRotate = false
        }
    }
    
    var magnifyEvent: some Gesture{
        MagnifyGesture().targetedToAnyEntity().onChanged{ value in
            print(value)
            if(isScale == false){
                print("start scale")
            }
            else{
                print("scaling")
            }
            isScale = true
        }.onEnded{ value in
            print("scale end")
            isScale = false
        }
    }
    
    var dragEvent: some Gesture{
        DragGesture().targetedToAnyEntity().onChanged{ value in
            if(isDrag == false){
                print("start drag")
            }
            else{
                print("dragging")
            }
            isDrag = true
            
        }.onEnded{ value in
            print("drag end")
            isDrag = false
        }
    }
    
    var body: some View {
        RealityView(make: { content in
            
        })
        .simultaneousGesture(spatialTapEvent)
        .simultaneousGesture(rotate3dEvent)
        .simultaneousGesture(dragEvent)
        .simultaneousGesture(magnifyEvent)
    }
}
