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
let nativeAPIVersion = "0.0.1"

// detect when app properties like defaultSize change so we can avoid race condition of setting default values and then opening window container
var sceneStateChangedCB: ((Any) -> Void) = { _ in
}

@main
struct web_spatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State var root: SpatialWindowComponent? = nil
    @State var rootWGD: SpatialWindowContainer
    @State var initialLaunch = true

    @ObservedObject var wgm = WindowContainerMgr.Instance

    @Environment(\.scenePhase) private var scenePhase

    init() {
        print("WebSpatial App Started --------")

        // init global logger
        Logger.initLogger()

        // init pwa manager
        pwaManager._init()

        // create root SpatialWindowContainer and Immersive SpatialWindowContainer
        rootWGD = SpatialWindowContainer.createRootWindowContainer()
        let _ = SpatialWindowContainer.createImmersiveWindowContainer()
    }

    func getFileUrl() -> URL {
        return URL(string: pwaManager.start_url)!
    }

    // There seems to be a bug in WKWebView where it needs to be initialized after the app has loaded so we do this here instead of init()
    // https://forums.developer.apple.com/forums/thread/61432
    func initAppOnViewMount() {
        if root == nil {
            let fileUrl = getFileUrl()

            // Create a default entity with webview resource
            let rootEntity = SpatialEntity()
            rootEntity.coordinateSpace = CoordinateSpaceMode.ROOT
            let windowComponent = SpatialWindowComponent(parentWindowContainerID: rootWGD.id, url: fileUrl)
            windowComponent.isRoot = true
            rootEntity.addComponent(windowComponent)
            rootEntity.setParentWindowContainer(wg: rootWGD)

            root = windowComponent
        }
    }

    func getDefaultSize() -> CGSize {
        sceneStateChangedCB("")
        return wgm.getValue().defaultSize!
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowContainerData.self) { $windowData in
            if windowData.windowContainerID == SpatialWindowContainer.getRootID() {
                VStack {}.onAppear { initAppOnViewMount() }

                PlainWindowContainerView().environment(rootWGD).background(Color.clear.opacity(0)).onOpenURL { myURL in
                    initAppOnViewMount()
                    let urlToLoad = pwaManager.checkInDeeplink(url: myURL.absoluteString)

                    if let url = URL(string: urlToLoad) {
                        root!.navigateToURL(url: url)
                    }
                }
            } else {
                let wg = SpatialWindowContainer.getOrCreateSpatialWindowContainer(
                    windowData.windowContainerID, windowData
                )
                PlainWindowContainerView().environment(wg)
                    // https://stackoverflow.com/questions/78567737/how-to-get-initial-windowgroup-to-reopen-on-launch-visionos
                    .handlesExternalEvents(preferring: [], allowing: [])
            }
        } defaultValue: {
            WindowContainerData(windowStyle: "Plain", windowContainerID: SpatialWindowContainer.getRootID())

        }.windowStyle(.plain).onChange(of: scenePhase) { oldPhase, newPhase in
            if oldPhase == .background && newPhase == .inactive {
                if initialLaunch {
                    // App initial open
                    initialLaunch = false
                } else {
                    // App reopened
                    let fileUrl = getFileUrl()
                    root?.navigateToURL(url: fileUrl)
                    rootWGD.setSize.send(DefaultPlainWindowContainerSize)
                }
            }
        }.defaultSize(
            getDefaultSize()
        ).windowResizability(
            wgm.getValue().windowResizability!
        )

        WindowGroup(id: "Volumetric", for: WindowContainerData.self) { $windowData in
            let wg = SpatialWindowContainer.getOrCreateSpatialWindowContainer(windowData!.windowContainerID, windowData!)
            VolumetricWindowContainerView().environment(wg).handlesExternalEvents(preferring: [], allowing: [])

        }.windowStyle(.volumetric).defaultSize(width: 1, height: 1, depth: 1, in: .meters)

        ImmersiveSpace(id: "ImmersiveSpace") {
            let wg = SpatialWindowContainer.getImmersiveWindowContainer()
            VolumetricWindowContainerView().environment(wg).handlesExternalEvents(preferring: [], allowing: [])
        }

        WindowGroup(id: "loading") {
            LoadingView()
        }
    }
}
