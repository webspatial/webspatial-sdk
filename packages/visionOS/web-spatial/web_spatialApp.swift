import typealias RealityKit.Attachment
import typealias RealityKit.Entity
import typealias RealityKit.MeshResource
import typealias RealityKit.Model3D
import typealias RealityKit.ModelEntity
import typealias RealityKit.RealityView
import typealias RealityKit.SimpleMaterial
import SwiftUI

let clock = PerfClock()
let logger = Logger()

// To load a local path, remove http:// eg.  "static-web/"
let nativeAPIVersion = pwaManager.getVersion()

// start URL
let startURL = pwaManager.start_url

// detect when app properties like defaultSize change so we can avoid race condition of setting default values and then opening window container
var sceneStateChangedCB: ((Any) -> Void) = { _ in
}

@main
struct web_spatialApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State var initialLaunch = true

    @ObservedObject var wgm = WindowContainerMgr.Instance

    @Environment(\.scenePhase) private var scenePhase

    init() {
        logger.debug("WebSpatial App Started -------- rootURL: " + startURL)

        // init global logger
        Logger.initLogger()

        // init pwa manager
        pwaManager._init()

        // create Immersive SpatialWindowContainer
        let _ = SpatialWindowContainer.createImmersiveWindowContainer()
    }

    func getFileUrl() -> URL {
        return URL(string: pwaManager.start_url)!
    }

    func getDefaultSize() -> CGSize {
        sceneStateChangedCB("")
        return wgm.getValue().defaultSize!
    }

    var body: some Scene {
        WindowGroup(id: "Plain", for: WindowContainerData.self) { $windowData in
            let wg = SpatialWindowContainer.getOrCreateSpatialWindowContainer(
                windowData.windowContainerID, windowData
            )
            PlainWindowContainerView().environment(wg)
            // https://stackoverflow.com/questions/78567737/how-to-get-initial-windowgroup-to-reopen-on-launch-visionos
//                    .handlesExternalEvents(preferring: [], allowing: [])
        }
        defaultValue: {
            let windowData = WindowContainerData(
                windowStyle: "Plain",
                windowContainerID: SpatialWindowContainer.getRootID()
            )

            // Initialize entity and webview for deafult value
            let fileUrl = getFileUrl()
            let wc = SpatialWindowContainer.getOrCreateSpatialWindowContainer(
                windowData.windowContainerID, windowData
            )!
            let rootEntity = SpatialEntity()
            rootEntity.coordinateSpace = CoordinateSpaceMode.ROOT
            let windowComponent = SpatialWindowComponent(parentWindowContainerID: wc.id, url: fileUrl)
            rootEntity.addComponent(windowComponent)
            rootEntity.setParentWindowContainer(wg: wc)
            return windowData
        }
        .windowStyle(.plain).onChange(of: scenePhase) {
            oldPhase,
                newPhase in
            if oldPhase == .background && newPhase == .inactive {
                if initialLaunch {
                    // App initial open
                    initialLaunch = false
                } else {
                    // App reopened

                    let fileUrl = getFileUrl()
                    if let awid = SpatialWindowContainer.firstActivePlainWindowContainerId,
                       let wc = SpatialWindowContainer.getSpatialWindowContainer(
                           awid
                       )
                    {
                        let rootEntity = wc.getEntities().filter {
                            $0.value.getComponent(SpatialWindowComponent.self) != nil && $0.value.coordinateSpace == .ROOT
                        }.first?.value

                        if let wv = rootEntity?.getComponent(SpatialWindowComponent.self) {
                            // remove the webview's name to behave like new opened root scene
                            if wv.getURL() != fileUrl {
                                wv.removeWebviewName {
                                    wv.navigateToURL(url: fileUrl)
                                }
                            }
                        }
                        // reset to mainScene size
                        wgm.setToMainSceneCfg()
                        if let resizeRange = wgm.getValue().resizeRange {
                            wc.setResizeRange.send(resizeRange)
                        }
                        wc.setSize.send(getDefaultSize())
                    }
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
            if let wg = SpatialWindowContainer.getImmersiveWindowContainer() {
                VolumetricWindowContainerView().environment(wg).handlesExternalEvents(preferring: [], allowing: [])
            }
        }

        WindowGroup(id: "loading") {
            LoadingView()
        }
    }
}
