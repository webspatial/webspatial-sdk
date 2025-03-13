//
//  SceneManager.swift
//  web-spatial
//
//  Created by ByteDance on 2025/2/6.
//

import Foundation

class SceneManager {
    static let Instance = SceneManager()

    private init() {}

    // create new container and move EC into it
    func moveECIntoNewContainer(target rootSWC: SpatialWindowComponent) {
        /// before:
        ///     rootWindowContainer -> [rootEntity -> rootSwc]
        /// after:
        ///     newWindowContainer -> [rootEntity -> rootSwc]
        ///

        // EC already exist
        let newWindowContainerID = UUID().uuidString
        // open window
        let wgd = WindowContainerData(
            windowStyle: "Plain",
            windowContainerID: newWindowContainerID
        )

        rootSWC.evaluateJS(js: "window._webSpatialGroupID='\(newWindowContainerID)';")

        let rootWindowContainerID = SpatialWindowContainer.getRootID()

        rootSWC.evaluateJS(js: "window._webSpatialParentGroupID='\(rootWindowContainerID)';")

        let rootEntity = rootSWC.entity!

        rootSWC.parentWindowContainerID = newWindowContainerID // E should point to new container

        let wg = SpatialWindowContainer.getOrCreateSpatialWindowContainer(newWindowContainerID, wgd)
        rootEntity.setParentWindowContainer(wg: wg)
    }

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
                windowComponent.setWebviewSceneHookFlag()
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

        let parentID = parentWindowContainerID
        let childID = target.parentWindowContainerID

        if let pwg = SpatialWindowContainer.getSpatialWindowContainer(parentID),
           let wg = SpatialWindowContainer.getSpatialWindowContainer(childID)
        {
            WindowContainerMgr.Instance
                .updateWindowContainerPlainDefaultValues(
                    plainDV
                ) // set default values
            if target.isDynamicRoot {
                WindowContainerMgr.Instance.memorizedMainSceneConfig = plainDV
            }

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

    func closeWindowContainer(_ target: SpatialWindowComponent, _ windowContainerID: String) {
        if let cwg = SpatialWindowContainer.getSpatialWindowContainer(target.parentWindowContainerID),
           let wgToBeClosed = SpatialWindowContainer.getSpatialWindowContainer(
               windowContainerID
           )
        {
            if cwg == wgToBeClosed {
                print("closeWindowContainer: cannot close self")
            }
            cwg.closeWindowData.send(wgToBeClosed.wgd)
        }
    }
}
