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
let initialPageToLoad = "http://localhost:5173/"
let nativeAPIVersion = "0.0.1"

@main
struct web_spatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State var root: SpatialWindowComponent? = nil
    @State var rootWGD: SpatialWindowGroup
    @State var initialLaunch = true

    @ObservedObject var wgm = WindowGroupMgr.Instance

    @Environment(\.scenePhase) private var scenePhase

    init() {
        print("WebSpatial App Started --------")

        // init global logger
        Logger.initLogger()

        // create root SpatialWindowGroup and Immersive SpatialWindowGroup
        rootWGD = SpatialWindowGroup.createRootWindowGroup()
        let _ = SpatialWindowGroup.createImmersiveWindowGroup()
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
            let rootEntity = SpatialEntity()
            rootEntity.coordinateSpace = CoordinateSpaceMode.ROOT
            let windowComponent = SpatialWindowComponent(parentWindowGroupID: rootWGD.id, url: fileUrl)
            rootEntity.addComponent(windowComponent)
            rootEntity.setParentWindowGroup(wg: rootWGD)

            root = windowComponent
        }
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowGroupData.self) { $windowData in
            if windowData.windowGroupID == SpatialWindowGroup.getRootID() {
                VStack {}.onAppear { initAppOnViewMount() }

                PlainWindowGroupView().environment(rootWGD).background(Color.clear.opacity(0)).cornerRadius(0).onOpenURL { myURL in
                    initAppOnViewMount()
                    let urlToLoad = myURL.absoluteString.replacingOccurrences(of: "webspatial://", with: "").replacingOccurrences(of: "//", with: "://")

                    if let url = URL(string: urlToLoad) {
                        root!.navigateToURL(url: url)
                    }
                }
            } else {
                let wg = SpatialWindowGroup.getOrCreateSpatialWindowGroup(
                    windowData.windowGroupID
                )
                PlainWindowGroupView().environment(wg)
                    // https://stackoverflow.com/questions/78567737/how-to-get-initial-windowgroup-to-reopen-on-launch-visionos
                    .handlesExternalEvents(preferring: [], allowing: [])
            }
        } defaultValue: {
            WindowGroupData(windowStyle: "Plain", windowGroupID: SpatialWindowGroup.getRootID())

        }.windowStyle(.plain).onChange(of: scenePhase) { oldPhase, newPhase in
            if oldPhase == .background && newPhase == .inactive {
                if initialLaunch {
                    // App initial open
                    initialLaunch = false
                } else {
                    // App reopened
                    let fileUrl = getFileUrl()
                    root?.navigateToURL(url: fileUrl)
                    rootWGD.setSize.send(DefaultPlainWindowGroupSize)
                }
            }
        }.defaultSize(
            wgm.getValue().defaultSize!
        ).windowResizability(
            wgm.getValue().windowResizability!
        )

        WindowGroup(id: "Volumetric", for: WindowGroupData.self) { $windowData in
            let wg = SpatialWindowGroup.getOrCreateSpatialWindowGroup(windowData!.windowGroupID)
            VolumetricWindowGroupView().environment(wg).handlesExternalEvents(preferring: [], allowing: [])

        }.windowStyle(.volumetric).defaultSize(width: 1, height: 1, depth: 1, in: .meters)

        ImmersiveSpace(id: "ImmersiveSpace") {
            let wg = SpatialWindowGroup.getImmersiveWindowGroup()
            VolumetricWindowGroupView().environment(wg).handlesExternalEvents(preferring: [], allowing: [])
        }

        WindowGroup(id: "loading", for: LoadingWindowGroupData.self) { _ in
            LoadingView()
        }
    }
}
