import Foundation

enum SceneState {
    case loading // not configured
    case active // configured，showing
    case closed // closed
}

class SpatialScene {
    // MARK: primary key

    var windowContainerID: String

    var swc: SpatialWindowComponent

    var state: SceneState = .loading

    var config: WindowContainerOptions?

    weak var parent: SpatialScene?

    var windowID: String?

    init(windowContainerID: String, swc: SpatialWindowComponent) {
        self.windowContainerID = windowContainerID
        self.swc = swc
    }

    init(config: WindowContainerOptions?,
         parent: SpatialScene,
         windowID: String)
    {
        self.config = config
        self.parent = parent
        self.windowID = windowID

        let windowContainerID = UUID().uuidString
        self.windowContainerID = windowContainerID

        swc = SpatialWindowComponent(
            parentWindowContainerID: windowContainerID
        )

        let wgd = WindowContainerData(
            windowStyle: "Plain",
            windowContainerID: windowContainerID
        )
        let ent = SpatialEntity()
        ent.coordinateSpace = CoordinateSpaceMode.ROOT
        let windowComponent = SpatialWindowComponent(
            parentWindowContainerID: windowContainerID
        )

        if let spawnedWebView = parent.swc.spawnedNativeWebviews.removeValue(forKey: windowID) {
            windowComponent.getView()!.destroy()
            windowComponent.setView(wv: spawnedWebView)
            windowComponent.getView()!.webViewHolder.webViewCoordinator!.webViewRef = windowComponent
            // focusRoot need the windowContainerID
            windowComponent.evaluateJS(js: "window._webSpatialGroupID='\(windowContainerID)';")

            if config != nil {
                // signal off hook
                windowComponent.evaluateJS(js: "window._SceneHookOff=true;")
            }
        } else {
            logger.warning("Unable to find spawned webview")
        }

        ent.addComponent(windowComponent)

        let wg = SpatialWindowContainer.getOrCreateSpatialWindowContainer(windowContainerID, wgd)
        ent.setParentWindowContainer(wg: wg)

        // if have config show it
        if let config = config {
            show(
                config: config
            )
        }
    }

    func show(config: WindowContainerOptions) {
        guard let parent = parent else {
            print("parent not defined")
            return
        }

        let plainDV = WindowContainerPlainDefaultValues(
            config
        )

        if let pwg = SpatialWindowContainer.getSpatialWindowContainer(parent.windowContainerID),
           let wg = SpatialWindowContainer.getSpatialWindowContainer(
               windowContainerID
           )
        {
            WindowContainerMgr.Instance
                .updateWindowContainerPlainDefaultValues(
                    plainDV
                ) // set default values
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                pwg.openWindowData.send(wg.wgd) // openwindow
            }
        }

        print("show Scene: \(windowContainerID)")
        state = .active
    }

    func focus() {
        if let wg = SpatialWindowContainer.getSpatialWindowContainer(windowContainerID) {
            wg.openWindowData.send(wg.wgd)
        }
    }

    func close() {
        if let wg = SpatialWindowContainer.getSpatialWindowContainer(windowContainerID) {
            wg.closeWindowData.send(wg.wgd)
        }
        print("close Scene: \(windowContainerID)")
        state = .closed
    }
}
