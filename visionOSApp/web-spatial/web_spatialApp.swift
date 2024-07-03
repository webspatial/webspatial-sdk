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
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    var root: SpatialWebView
    var rootWGD: WindowGroupContentDictionary

    init() {
        print("WebSpatial App Started --------")

        // "http://10.73.196.42:5173/loadTsx.html?pageName=helloWorldApp/main.tsx"
        let rootEnt = SpatialResource(resourceType: "Entity", mngr: wgManager, windowGroupID: "root", owner: nil)
        let sr = SpatialResource(resourceType: "SpatialWebView", mngr: wgManager, windowGroupID: "root", owner: nil)

        root = SpatialWebView(parentWindowGroupID: "root", url: URL(string: "http://localhost:5173")!)
        root.root = true
        root.resourceID = sr.id
        root.childResources[sr.id] = sr
        sr.spatialWebView = root
        rootEnt.spatialWebView = root
        rootEnt.spatialWebView?.inline = true

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
                PlainWindowGroupView(windowGroupContent: rootWGD).background(Color.clear.opacity(0)).cornerRadius(0).onOpenURL { myURL in
                    let urlToLoad = myURL.absoluteString.replacingOccurrences(of: "webspatial://", with: "").replacingOccurrences(of: "//", with: "://")
                    print(urlToLoad)

                    if let url = URL(string: urlToLoad) {
                        let request = URLRequest(url: url)
                        root.webViewNative?.url = url
                        root.webViewNative?.webViewHolder.appleWebView!.load(request)
                    }
                }
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
