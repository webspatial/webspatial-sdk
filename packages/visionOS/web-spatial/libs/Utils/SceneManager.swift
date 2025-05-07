import Foundation

class SceneManager {
    static let Instance = SceneManager()

    private init() {}

    // create scene
    // if config is provided, it show immediately
    // else it won't show until showRoot is called
    func createRoot(target: SpatialWindowComponent, windowID: String, config: WindowContainerOptions? = nil) {
        let windowContainerID = UUID().uuidString
        // open window
        let wgd = WindowContainerData(
            windowStyle: "Plain",
            windowContainerID: windowContainerID
        )
        let ent = SpatialEntity()
        ent.coordinateSpace = CoordinateSpaceMode.ROOT
        let windowComponent = SpatialWindowComponent(
            parentWindowContainerID: windowContainerID
        )

        if let spawnedWebView = target.spawnedNativeWebviews.removeValue(forKey: windowID) {
            windowComponent.getView()!.destroy()
            windowComponent.setView(wv: spawnedWebView)
            windowComponent.getView()!.webViewHolder.webViewCoordinator!.webViewRef = windowComponent
            // focusRoot need the windowContainerID
            windowComponent.evaluateJS(js: "window._webSpatialGroupID='\(windowContainerID)';")
            // tell new webview parentWindowContainerID to open loadingview
            windowComponent.evaluateJS(js: "window._webSpatialParentGroupID='\(target.parentWindowContainerID)';")

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

        if let config = config {
            showRoot(
                target: windowComponent,
                config: config,
                parentWindowContainerID: target.parentWindowContainerID
            )
        }
    }

    // set defaultvalues for the scene and show it
    func showRoot(target: SpatialWindowComponent, config: WindowContainerOptions, parentWindowContainerID: String) {
        let plainDV = WindowContainerPlainDefaultValues(
            config
        )

        if let pwg = SpatialWindowContainer.getSpatialWindowContainer(parentWindowContainerID),
           let wg = SpatialWindowContainer.getSpatialWindowContainer(
               target.parentWindowContainerID
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
    }

    // bring the scene to focus
    func focusRoot(target: SpatialWindowComponent, windowContainerID: String) {
        if let wg = SpatialWindowContainer.getSpatialWindowContainer(windowContainerID) {
            wg.openWindowData.send(wg.wgd)
        }
    }

    // show LodingView when window.xrCurrentSceneDefaults is executing
    func setLoading(_ method: LoadingMethod, windowContainerID: String) {
        // trigger open loading view by parent windowContainer due to current windowContainer isn't visible yet
        if let wg = SpatialWindowContainer.getSpatialWindowContainer(windowContainerID) {
            let lwgdata = LoadingWindowContainerData(
                method: method,
                windowStyle: nil
            )
            wg.setLoadingWindowData.send(lwgdata)
        }
    }

    // dismiss the scene content when webview closed
    func closeRoot(_ target: SpatialWindowComponent) {
        if let wg = SpatialWindowContainer.getSpatialWindowContainer(target.parentWindowContainerID) {
            wg.closeWindowData.send(wg.wgd)
        }
    }
}
