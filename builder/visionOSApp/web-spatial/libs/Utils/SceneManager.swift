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

    // create scene
    // if config is provided, it show immediately
    // else it won't show until showRoot is called
    func createRoot(target: SpatialWindowComponent, windowID: String, config: WindowGroupOptions? = nil) {
        let windowGroupID = UUID().uuidString
        // open window
        let wgd = WindowGroupData(
            windowStyle: "Plain",
            windowGroupID: windowGroupID
        )
        let ent = SpatialEntity()
        ent.coordinateSpace = CoordinateSpaceMode.ROOT
        let windowComponent = SpatialWindowComponent(
            parentWindowGroupID: windowGroupID
        )

        if let spawnedWebView = target.spawnedNativeWebviews.removeValue(forKey: windowID) {
            windowComponent.getView()!.destroy()
            windowComponent.setView(wv: spawnedWebView)
            windowComponent.getView()!.webViewHolder.webViewCoordinator!.webViewRef = windowComponent
            // focusRoot need the windowGroupID
            windowComponent.evaluateJS(js: "window._webSpatialGroupID='\(windowGroupID)';")
            // tell new webview parentWindowGroupID to open loadingview
            windowComponent.evaluateJS(js: "window._webSpatialParentGroupID='\(target.parentWindowGroupID)';")

            if config != nil {
                // signal off hook
                windowComponent.evaluateJS(js: "window._SceneHookOff=true;")
            }
        } else {
            print("no spawned")
        }

        windowComponent.isRoot = true // register close

        ent.addComponent(windowComponent)

        let wg = SpatialWindowGroup.getOrCreateSpatialWindowGroup(windowGroupID)
        wg!.wgd = wgd
        ent.setParentWindowGroup(wg: wg)

        if let config = config {
            showRoot(
                target: windowComponent,
                config: config,
                parentWindowGroupID: target.parentWindowGroupID
            )
        }
    }

    // set defaultvalues for the scene and show it
    func showRoot(target: SpatialWindowComponent, config: WindowGroupOptions, parentWindowGroupID: String) {
        let plainDV = WindowGroupPlainDefaultValues(
            config
        )

        if let pwg = SpatialWindowGroup.getSpatialWindowGroup(parentWindowGroupID),
           let wg = SpatialWindowGroup.getSpatialWindowGroup(
               target.parentWindowGroupID
           )
        {
            WindowGroupMgr.Instance
                .updateWindowGroupPlainDefaultValues(
                    plainDV
                ) // set default values
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                pwg.openWindowData.send(wg.wgd!) // openwindow
            }
        }
    }

    // bring the scene to focus
    func focusRoot(target: SpatialWindowComponent, windowGroupID: String) {
        if let wg = SpatialWindowGroup.getSpatialWindowGroup(windowGroupID) {
            wg.openWindowData.send(wg.wgd!)
        }
    }

    // show LodingView when window.xrCurrentSceneDefaults is executing
    func setLoading(_ method: LoadingMethod, windowGroupID: String) {
        // trigger open loading view by parent windowGroup due to current windowGroup isn't visible yet
        if let wg = SpatialWindowGroup.getSpatialWindowGroup(windowGroupID) {
            let lwgdata = LoadingWindowGroupData(
                method: method,
                windowStyle: nil
            )
            wg.setLoadingWindowData.send(lwgdata)
        }
    }

    // dismiss the scene content when webview closed
    func closeRoot(_ target: SpatialWindowComponent) {
        if let wg = SpatialWindowGroup.getSpatialWindowGroup(target.parentWindowGroupID) {
            wg.closeWindowData.send(wg.wgd!)
        }
    }
}
