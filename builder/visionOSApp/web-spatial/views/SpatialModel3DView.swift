//
//  SpatialModel3DView.swift
//  web-spatial
//
//  Created by ByteDance on 1/21/25.
//
import RealityKit
import SwiftUI

struct SpatialModel3DView: View {
    @Environment(SpatialEntity.self) var e: SpatialEntity
    var parentYOffset = Float(0.0)

    var body: some View {
        if e.coordinateSpace == .DOM {
            if let childModel3DComponent = e.getComponent(SpatialModel3DComponent.self) {
                if e.coordinateSpace == .DOM {
                    let x = CGFloat(e.modelEntity.position.x)
                    let y = CGFloat(e.modelEntity.position.y - (childModel3DComponent.scrollWithParent ? parentYOffset : 0))
                    let z = CGFloat(e.modelEntity.position.z)
                    let width = CGFloat(childModel3DComponent.resolutionX)
                    let height = CGFloat(childModel3DComponent.resolutionY)
                    let anchor = childModel3DComponent.rotationAnchor
                    let opacity = childModel3DComponent.opacity

                    let url = URL(string: childModel3DComponent.modelURL)!

                    // Matrix = MTranslate X MRotate X MScale
                    Model3D(url: url) { newPhase in
                        switch newPhase {
                        case .empty:
                            ProgressView()

                        case let .success(resolvedModel3D):
                            resolvedModel3D
                                .resizable()
                                .aspectRatio(contentMode: .fit)

                        case let .failure(error):
                            ContentUnavailableView(error.localizedDescription, systemImage: "exclamationmark.triangle.fill")

                        @unknown default:
                            EmptyView()
                        }
                    }
                    .frame(width: width, height: height)
                    // use .offset(smallVal) to workaround for glassEffect not working and small width/height spatialDiv not working
                    .offset(z: 0.0001)
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
                    .opacity(opacity)
                }
            }
        }
    }
}
