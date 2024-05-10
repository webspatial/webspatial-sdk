//
//  VolumetricWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import SwiftUI
import typealias RealityKit.RealityView
import typealias RealityKit.Entity
import typealias RealityKit.Attachment
import typealias RealityKit.Model3D
import typealias RealityKit.MeshResource
import typealias RealityKit.SimpleMaterial
import typealias RealityKit.ModelEntity


struct VolumetricWindowGroupView : View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @ObservedObject var windowGroupContent : WindowGroupContentDictionary

    
    var body: some View {
        RealityView { content, attachments in
            let sphereResource = MeshResource.generateSphere(radius: 0.1)
            let myMaterial = SimpleMaterial(color: .blue, roughness: 0, isMetallic: true)
            let myEntity = ModelEntity(mesh: sphereResource, materials: [myMaterial])
            
            myEntity.position = [0, 0, 0.2]
            content.add(myEntity)
            
            for key in Array(windowGroupContent.webViews.keys) {
                if let glassCubeAttachment = attachments.entity(for: key) {
                   // glassCubeAttachment.position = [0.5, 0, 0]
                    content.add(glassCubeAttachment)
                }
            }
           
//                ForEach(Array(wg2.wgData.keys), id: \.self){ key in
////                    if let glassCubeAttachment = attachments.entity(for: key) {
////                       // glassCubeAttachment.position = [0.5, 0, 0]
////                        //content.add(glassCubeAttachment)
////                    }
//                }
//
//                if let glassCubeAttachment = attachments.entity(for: "") {
//                   // glassCubeAttachment.position = [0.5, 0, 0]
//                    //content.add(glassCubeAttachment)
//                }
//
            
        } update: { content, attachments in
            for key in Array(windowGroupContent.webViews.keys) {
                if let glassCubeAttachment = attachments.entity(for: key) {
                   // glassCubeAttachment.position = [0.5, 0, 0]
                    glassCubeAttachment.position = windowGroupContent.webViews[key]!.pose;
                   
                }
            }
        } attachments: {
            ForEach(Array(windowGroupContent.webViews.keys), id: \.self){ key in
                Attachment(id: key) {
                    windowGroupContent.webViews[key]?.webView.glassBackgroundEffect()
                }
            }
            
           
        }
    }
}
