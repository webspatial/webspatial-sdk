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

// To load a local path, remove http:// eg.  "static-web/"
let initialPageToLoad = "http://localhost:5173"

struct WindowGroupData: Decodable, Hashable, Encodable {
    let windowStyle: String
    let windowGroupID: String
}

@main
struct web_spatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State var root: SpatialWebView? = nil
    @State var rootWGD: WindowGroupContentDictionary

    init() {
        print("WebSpatial App Started --------")

        // init global logger
        Logger.initLogger()

        rootWGD = wgManager.getWindowGroup(windowGroup: "root")
        let _ = wgManager.getWindowGroup(windowGroup: "Immersive")
    }

    func getFileUrl() -> URL {
        var useStaticFile = true
        let urlType = initialPageToLoad.split(separator: "://").first
        if urlType == "http" || urlType == "https" {
            useStaticFile = false
        }
        let fileUrl = useStaticFile ? Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: initialPageToLoad)! : URL(string: initialPageToLoad)!
        return fileUrl
    }

    // There seems to be a bug in WKWebView where it needs to be initialized after the app has loaded so we do this here instead of init()
    // https://forums.developer.apple.com/forums/thread/61432
    func initAppOnViewMount() {
        if root == nil {
            let fileUrl = getFileUrl()

            // Create a default entity with webview resource
            let rootEnt = SpatialResource(resourceType: "Entity", mngr: wgManager, windowGroupID: "root", owner: nil)
            let sr = SpatialResource(resourceType: "SpatialWebView", mngr: wgManager, windowGroupID: "root", owner: nil)
            root = SpatialWebView(parentWindowGroupID: "root", url: fileUrl)
            rootEnt.coordinateSpace = CoordinateSpaceMode.ROOT
            root!.resourceID = sr.id
            sr.spatialWebView = root
            rootEnt.spatialWebView = root
            root!.visible = true
            rootWGD.childEntities[rootEnt.id] = rootEnt
            rootEnt.parentWindowGroup = rootWGD
        }
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowGroupData.self) { $windowData in
            if windowData == nil {
                VStack {}.onAppear { initAppOnViewMount() }

                PlainWindowGroupView().environment(rootWGD).background(Color.clear.opacity(0)).cornerRadius(0).onOpenURL { myURL in
                    initAppOnViewMount()
                    let urlToLoad = myURL.absoluteString.replacingOccurrences(of: "webspatial://", with: "").replacingOccurrences(of: "//", with: "://")

                    if let url = URL(string: urlToLoad) {
                        root!.navigateToURL(url: url)
                    }
                }
            } else {
                let wg = wgManager.getWindowGroup(windowGroup: windowData!.windowGroupID)
                PlainWindowGroupView().environment(wg)
                    // https://stackoverflow.com/questions/78567737/how-to-get-initial-windowgroup-to-reopen-on-launch-visionos
                    .handlesExternalEvents(preferring: [], allowing: [])
            }
        }.windowStyle(.plain)

        WindowGroup(id: "Volumetric", for: WindowGroupData.self) { $windowData in
            let wg = wgManager.getWindowGroup(windowGroup: windowData!.windowGroupID)
            VolumetricWindowGroupView().environment(wg).handlesExternalEvents(preferring: [], allowing: [])

        }.windowStyle(.volumetric).defaultSize(width: 1, height: 1, depth: 1, in: .meters)

        ImmersiveSpace(id: "ImmersiveSpace") {
            let wg = wgManager.getWindowGroup(windowGroup: "Immersive")
            VolumetricWindowGroupView().environment(wg).handlesExternalEvents(preferring: [], allowing: [])
        }
    }
}
