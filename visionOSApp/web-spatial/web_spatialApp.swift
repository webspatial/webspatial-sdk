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

        // "http://testIP:5173/?pageName=helloWorldApp/main.tsx"
        let rootEnt = SpatialResource(resourceType: "Entity", mngr: wgManager, windowGroupID: "root", owner: nil)
        let sr = SpatialResource(resourceType: "SpatialWebView", mngr: wgManager, windowGroupID: "root", owner: nil)

        root = SpatialWebView(parentWindowGroupID: "root", url: URL(string: "http://localhost:5173/testList.html")!)
        root.root = true
        root.resourceID = sr.id
        root.childResources[sr.id] = sr
        sr.spatialWebView = root
        rootEnt.spatialWebView = root

        // root = wgManager.createWebView(windowGroup: "root", windowID: "root", url: URL(string: "http://testIP:5173/testList.html")!)
        root.full = true
        root.visible = true
        rootWGD = wgManager.getWindowGroup(windowGroup: "root")
        rootWGD.childEntities[rootEnt.id] = rootEnt
        rootEnt.parentWindowGroup = rootWGD

        let _ = wgManager.getWindowGroup(windowGroup: "Immersive")
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowGroupData.self) { $windowData in
            if windowData == nil {
                PlainWindowGroupView(windowGroupContent: rootWGD).background(Color.clear.opacity(0)).cornerRadius(0)
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
