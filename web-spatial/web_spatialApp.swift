//
//  web_spatialApp.swift
//  web-spatial
//
//  Created by ByteDance on 5/8/24.
//

import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

struct WindowGroupData: Decodable, Hashable, Encodable {
    let windowStyle: String
    let windowGroupID: String
}

@main
struct web_spatialApp: App {
    var root: SpatialWebView
    var rootWGD: WindowGroupContentDictionary

    init() {
        print("WebSpatial App Started --------")

        // "http://npmURL:5173/?pageName=helloWorldApp/main.tsx"
        root = wgManager.createWebView(windowGroup: "root", windowID: "root", url: URL(string: "http://npmURL:5173/testList.html")!)
        rootWGD = wgManager.getWindowGroup(windowGroup: "root")
        let _ = wgManager.getWindowGroup(windowGroup: "Immersive")
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowGroupData.self) { $windowData in
            if windowData == nil {
                PlainWindowGroupView(windowGroupContent: rootWGD).background(Color.clear.opacity(0))
            } else {
                let wg = wgManager.getWindowGroup(windowGroup: windowData!.windowGroupID)
                PlainWindowGroupView(windowGroupContent: wg)
            }
        }.windowStyle(.plain)

        WindowGroup(id: "Volumetric", for: WindowGroupData.self) { $windowData in
            let wg = wgManager.getWindowGroup(windowGroup: windowData!.windowGroupID)
            VolumetricWindowGroupView(windowGroupContent: wg)

        }.windowStyle(.volumetric).defaultSize(width: 1, height: 1, depth: 1, in: .meters)

        ImmersiveSpace(id: "ImmersiveSpace") {
            let wg = wgManager.getWindowGroup(windowGroup: "Immersive")
            VolumetricWindowGroupView(windowGroupContent: wg)
        }
    }
}
