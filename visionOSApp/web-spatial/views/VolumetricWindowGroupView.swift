//
//  VolumetricWindowGroupView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

struct VolumetricWindowGroupView: View {
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    @Environment(\.openWindow) private var openWindow
    @ObservedObject var windowGroupContent: WindowGroupContentDictionary

    var body: some View {
        RealityView { _, _ in
        } update: { content, attachments in

            for (_, entity) in windowGroupContent.childEntities {
                content.add(entity.modelEntity)
            }

            for key in Array(windowGroupContent.childEntities.keys) {
                let e = windowGroupContent.childEntities[key]!
                if e.spatialWebView != nil && !e.spatialWebView!.inline {
                    if let glassCubeAttachment = attachments.entity(for: key) {
                        //   glassCubeAttachment.position = e.modelEntity.position
                        if e.modelEntity.children.count == 0 {
                            e.modelEntity.addChild(glassCubeAttachment, preservingWorldTransform: false)
                        }
                    }
                }
            }
        } attachments: {
            ForEach(Array(windowGroupContent.childEntities.keys), id: \.self) { key in
                let e = windowGroupContent.childEntities[key]!
                if e.spatialWebView != nil && !e.spatialWebView!.inline {
                    Attachment(id: key) {
                        let wv = e.spatialWebView!
                        wv.webViewNative.background(wv.glassEffect ? Color.clear.opacity(0) : Color.white)
                            .glassBackgroundEffect(in: RoundedRectangle(cornerRadius: wv.cornerRadius), displayMode: wv.glassEffect ? .always : .never)
                            .cornerRadius(wv.cornerRadius).frame(width: wv.resolutionX, height: wv.resolutionY)
                    }
                }
            }
        }
    }
}
