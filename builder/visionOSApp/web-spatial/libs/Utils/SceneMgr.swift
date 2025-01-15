//
//  SceneMgr.swift
//  web-spatial
//
//  Created by ByteDance on 2024/12/2.
//

import Combine
import UIKit
import WebKit

typealias Config = WindowGroupOptions

struct SceneJSBData: Codable {
    var method: String?
    var sceneName: String?
    var sceneConfig: Config?
    var url: String?
    var windowID: String?
}

struct WGData {
    let webview: WKWebView
    let wgd: WindowGroupData
}

// Define SceneMgr class
class SceneMgr {
    private static var _instance: SceneMgr?

    static var Instance: SceneMgr {
        get {
            if _instance == nil {
                _instance = SceneMgr()
            }
            return _instance!
        }
        set {
            // not allowed
        }
    }

    private var cancellables = Set<AnyCancellable>() // save subscriptions

    private init() {
        webViewDidCloseData
            .sink { [weak self] webView in
                _ = self?.close(webView)
            }
            .store(in: &cancellables)

        // get webview's swc
        webviewGetEarlyStyleData
            .sink { [weak self] event in
                if let swc = self?.getSWCbyWebview(event.webview) {
                    swc.didGetEarlyStyle(style: event.style)
                }
            }
            .store(in: &cancellables)
    }

    deinit {
        cancellables.removeAll()
    }

    private var sceneMap: [String: Config] = [:] // Store the scene config mappings

    private var windowIDToWGData: [String: WGData] = [:] // windowID to WGData mapping

    private var webviewToWindowID: [WKWebView: String] = [:] // webview to windowID mapping

    private let logger = Logger.getLogger()

    // Add mapping WKWebView
    private func addWebViewMapping(
        webView: WKWebView,
        windowID: String,
        wgd: WindowGroupData
    ) {
        webviewToWindowID[webView] = windowID
        windowIDToWGData[windowID] = WGData(webview: webView, wgd: wgd)
    }

    // Remove mapping WKWebView
    private func removeWebViewMapping(webView: WKWebView) {
        if let windowID = webviewToWindowID[webView] {
            webviewToWindowID.removeValue(forKey: webView)
            windowIDToWGData.removeValue(forKey: windowID)
        } else {
            logger.error("windowID record not found")
        }
    }

    // find SpatialWindowComponent by webview
    func getSWCbyWebview(_ webview: WKWebView) -> SpatialWindowComponent? {
        if let windowID = webviewToWindowID[webview],
           let wgdata = windowIDToWGData[windowID],
           let wg = SpatialWindowGroup.getSpatialWindowGroup(wgdata.wgd.windowGroupID)
        {
            let rootEntity = wg.getEntities().filter {
                $0.value.getComponent(SpatialWindowComponent.self) != nil && $0.value.coordinateSpace == .ROOT
            }.first?.value

            let wv = rootEntity?.getComponent(SpatialWindowComponent.self)
            return wv
        }
        return nil
    }

    // Get config for a specific scene
    func getConfig(_ name: String) -> Config? {
        return sceneMap[name]
    }

    // Get all scene configs
    func getConfig() -> [String: Config] {
        return sceneMap.reduce(into: [String: Config]()) { result, entry in
            result[entry.key] = entry.value
        }
    }

    // Set scene config
    func setConfig(sceneName: String, cfg: Config) -> Bool {
        sceneMap[sceneName] = cfg
        return true
    }

    // Delete scene config
    func delConfig(sceneName: String) -> Bool {
        // Ensure existing ones can't be deleted if the scene is currently open
        guard let scene = sceneMap[sceneName] else {
            // If the scene exists and has an associated wgd, prevent deletion
            return false
        }
        sceneMap.removeValue(forKey: sceneName)
        return true
    }

    // Open scene
    func open(sceneName name: String, url: String, from: SpatialWindowComponent, windowID: String?) -> Bool {
        var sceneName = name
        // if is anonymous scene
        if sceneName == "" {
            // create unique name and set its config
            sceneName = UUID().uuidString
            _ = setConfig(
                sceneName: sceneName,
                cfg: Config(
                    defaultSize: Config.Size(
                        width: DefaultPlainWindowGroupSize.width,
                        height: DefaultPlainWindowGroupSize.height
                    ),
                    resizability: nil
                )
            )
        }
        guard var config = sceneMap[sceneName] else {
            // sceneName does not exist
            return false
        }

        guard let windowID = windowID else {
            // no windowID
            return false
        }

        // if scene already opened, navigate to new url
        if let wgdata = windowIDToWGData[windowID] {
            let wgid = wgdata.wgd.windowGroupID
            let wg = SpatialWindowGroup
                .getOrCreateSpatialWindowGroup(wgid)

            wg?.openWindowData.send(wgdata.wgd) // bring to focus

            return true
        }

        // Logic for opening the scene

        // set default values
        let plainDV = WindowGroupPlainDefaultValues(
            defaultSize: CGSize(
                width: config.defaultSize?.width ?? DefaultPlainWindowGroupSize.width,
                height: config.defaultSize?.height ?? DefaultPlainWindowGroupSize.height
            ),
            windowResizability: getWindowResizability(
                config.resizability
            )
        )

        let windowGroupID = UUID().uuidString
        // open window
        let wgd = WindowGroupData(
            windowStyle: "Plain",
            windowGroupID: windowGroupID
        )

        if let pwg = SpatialWindowGroup.getSpatialWindowGroup(from.parentWindowGroupID) {
            WindowGroupMgr.Instance.update(plainDV) // set default values
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                pwg.openWindowData.send(wgd) // openwindow
            }
        }

        // create EC
        let ent = SpatialEntity()
        ent.coordinateSpace = CoordinateSpaceMode.ROOT
        let windowComponent = SpatialWindowComponent(
            parentWindowGroupID: windowGroupID
        )

        // attach spawned webview to windowComponent

        if let spawnedWebView = from.spawnedNativeWebviews.removeValue(
            forKey: windowID
        ) {
            windowComponent.getView()!.destroy()
            windowComponent.setView(wv: spawnedWebView)
            windowComponent.getView()!.webViewHolder.webViewCoordinator!.webViewRef = windowComponent
        } else {
            logger.error("no spawned")
            return false
        }

        ent.addComponent(windowComponent)

        let isFirstCreate = SpatialWindowGroup.getSpatialWindowGroup(windowGroupID) == nil

        let wg = SpatialWindowGroup
            .getOrCreateSpatialWindowGroup(windowGroupID)

        if isFirstCreate {
            // before view destroy do some clean up
            wg!.on(event: SpatialObject.Events.BeforeDestroyed.rawValue, listener: { _, _ in
                if let wv = windowComponent
                    .getView()?.webViewHolder.appleWebView
                {
                    wv.uiDelegate?.webViewDidClose?(wv)
                }

            })
            wg!.on(event: SpatialObject.Events.Destroyed.rawValue, listener: { _, _ in
                self.delScene(sceneName)
            })
        }

        ent.setParentWindowGroup(wg: wg)

        // save webview->wgdata map
        addWebViewMapping(
            webView: windowComponent.getView()!.webViewHolder.appleWebView!,
            windowID: windowID,
            wgd: wgd
        )

        return true
    }

    // Close scene
    func close(_ windowID: String) -> Bool {
        guard let wgdata = windowIDToWGData[windowID] else {
            // sceneName does not exist
            return false
        }
        // Logic for closing the scene
        let wgd = wgdata.wgd
        if let pwg = SpatialWindowGroup.getSpatialWindowGroup(
            wgd.windowGroupID
        ) {
            pwg.closeWindowData.send(wgd)
            return true
        } else {
            // scene not opened yet
            return false
        }
    }

    // Close a scene by WKWebView
    func close(_ webView: WKWebView) -> Bool {
        if let windowID = webviewToWindowID[webView],
           close(windowID)
        {
            removeWebViewMapping(webView: webView)
            return true
        } else {
            logger.error("Failed to close due")
            return false
        }
    }

    // Set scene wgd to nil
    func delScene(_ sceneName: String) {
        if let wgdata = windowIDToWGData[sceneName] {
            windowIDToWGData.removeValue(forKey: sceneName)
        }
    }
}
