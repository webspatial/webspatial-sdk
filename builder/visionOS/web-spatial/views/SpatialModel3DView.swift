import RealityKit
import SwiftUI

class SpatialModel3DViewGestureData {
    // for dragging state
    var isDragging = false
}

struct SpatialModel3DView: View {
    @Environment(SpatialEntity.self) var e: SpatialEntity
    var parentYOffset = Float(0.0)

    @State private var gestureData = SpatialModel3DViewGestureData()

    var drag: some Gesture {
        DragGesture()
            .onChanged(onDragging)
            .onEnded(onDraggingEnded)
    }

    var tapGesture: some Gesture {
        TapGesture(count: 1)
            .onEnded(onTapEnded)
    }

    var doubleTapGesture: some Gesture {
        TapGesture(count: 2)
            .onEnded(onDoubleTapEnded)
    }

    var longPressGesture: some Gesture {
        LongPressGesture(minimumDuration: 1.0)
            .onEnded(onLonePressEnded)
    }

    @ViewBuilder
    var body: some View {
        if e.coordinateSpace == .DOM {
            if let childModel3DComponent = e.getComponent(SpatialModel3DComponent.self),
               let url = URL(string: childModel3DComponent.modelURL)
            {
                let x = CGFloat(e.modelEntity.position.x)
                let y = CGFloat(e.modelEntity.position.y - (childModel3DComponent.scrollWithParent ? parentYOffset : 0))
                let z = CGFloat(e.modelEntity.position.z)
                let width = CGFloat(childModel3DComponent.resolutionX)
                let height = CGFloat(childModel3DComponent.resolutionY)
                let anchor = childModel3DComponent.rotationAnchor
                let opacity = childModel3DComponent.opacity
                let resizable = childModel3DComponent.resizable
                let aspectRatio: CGFloat? = childModel3DComponent.aspectRatio == nil ? nil : CGFloat(childModel3DComponent.aspectRatio!)
                let contentMode = childModel3DComponent.contentMode

                let enableTapEvent = childModel3DComponent.enableTapEvent
                let enableDoubleTapEvent = childModel3DComponent.enableDoubleTapEvent
                let enableDragEvent = childModel3DComponent.enableDragEvent
                let enableLongPressEvent = childModel3DComponent.enableLongPressEvent

                // Matrix = MTranslate X MRotate X MScale
                Model3D(url: url) { newPhase in
                    switch newPhase {
                    case .empty:
                        ProgressView()

                    case let .success(resolvedModel3D):
                        resolvedModel3D
                            .resizable(resizable)
                            .aspectRatio(
                                aspectRatio,
                                contentMode: contentMode
                            )

                            .onAppear {
                                self.onLoadSuccess()
                            }

                    case let .failure(error):
                        //                            use UIView.onAppear to notify error phase.
                        Text("").onAppear {
                            self.onLoadFailure(error.localizedDescription)
                        }

                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(width: width, height: height)
                //                    .background(Color.blue)
                .scaleEffect(
                    x: CGFloat(e.modelEntity.scale.x),
                    y: CGFloat(e.modelEntity.scale.y),
                    z: CGFloat(e.modelEntity.scale.z),
                    anchor: anchor
                )
                .rotation3DEffect(
                    Rotation3D(simd_quatf(
                        ix: e.modelEntity.orientation.vector.x,
                        iy: e.modelEntity.orientation.vector.y,
                        iz: e.modelEntity.orientation.vector.z,
                        r: e.modelEntity.orientation.vector.w
                    )),
                    anchor: anchor
                )
                .position(x: x, y: y)
                .offset(z: z)
                .frame(maxDepth: 0, alignment: .back)
                .opacity(opacity)
                .gesture(enableDragEvent ? drag : nil)
                .gesture(enableDoubleTapEvent ?doubleTapGesture : nil)
                .gesture(enableTapEvent ? tapGesture : nil)
                .gesture(enableLongPressEvent ? longPressGesture : nil)
                .hidden(!e.visible)
            } else {
                Text("").onAppear {
                    self.onLoadFailure("invalid URL")
                }
            }
        } else {
            EmptyView()
        }
    }

    private func onLoadSuccess() {
        if let model3DComponent = e.getComponent(SpatialModel3DComponent.self) {
            let data = "{eventType: 'phase', value: 'success'}"
            model3DComponent.wv?.fireComponentEvent(componentId: model3DComponent.id, data: data)
        }
    }

    private func onLoadFailure(_ error: String) {
        if let model3DComponent = e.getComponent(SpatialModel3DComponent.self) {
            let data = "{eventType: 'phase', value: 'failure', error: '\(error)'} "
            model3DComponent.wv?.fireComponentEvent(componentId: model3DComponent.id, data: data)
        }
    }

    private func onDragging(dragValue: DragGesture.Value) {
        var eventType = "drag"
        if !gestureData.isDragging {
            gestureData.isDragging = true
            eventType = "dragstart"
        }
        fireDragEvent(eventType, dragValue)
    }

    private func onDraggingEnded(dragValue: DragGesture.Value) {
        gestureData.isDragging = false
        let eventType = "dragend"
        fireDragEvent(eventType, dragValue)
    }

    private func onTapEnded(_: TapGesture.Value) {
        print("onTapEnded")
        if let model3DComponent = e.getComponent(SpatialModel3DComponent.self) {
            let eventType = "tap"
            let data = "{eventType: '\(eventType)' } "
            model3DComponent.wv?.fireComponentEvent(componentId: model3DComponent.id, data: data)
        }
    }

    private func onDoubleTapEnded(_: TapGesture.Value) {
        print("onDoubleTapEnded")
        if let model3DComponent = e.getComponent(SpatialModel3DComponent.self) {
            let eventType = "doubletap"
            let data = "{eventType: '\(eventType)' } "
            model3DComponent.wv?.fireComponentEvent(componentId: model3DComponent.id, data: data)
        }
    }

    private func onLonePressEnded(_: LongPressGesture.Value) {
        print("onLonePressEnded")
        if let model3DComponent = e.getComponent(SpatialModel3DComponent.self) {
            let eventType = "longpress"
            let data = "{eventType: '\(eventType)' } "
            model3DComponent.wv?.fireComponentEvent(componentId: model3DComponent.id, data: data)
        }
    }

    private func fireDragEvent(_ eventType: String, _ value: DragGesture.Value) {
        if let model3DComponent = e.getComponent(SpatialModel3DComponent.self) {
            let startLocation3D = value.startLocation3D
            let translation3D = value.translation3D

            let data = "{eventType: '\(eventType)', value: { translation3D : { x: \(translation3D.x), y: \(translation3D.y), z: \(translation3D.z) }, startLocation3D: { x: \(startLocation3D.x), y: \(startLocation3D.y), z: \(startLocation3D.z)} } } "
            model3DComponent.wv?.fireComponentEvent(componentId: model3DComponent.id, data: data)
        }
    }
}
