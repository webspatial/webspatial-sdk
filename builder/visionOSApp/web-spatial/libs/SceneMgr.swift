//
//  SceneMgr.swift
//  web-spatial
//
//  Created by ByteDance on 2024/12/2.
//

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

// Define SceneData structure
struct SceneData {
    var config: Config
    var wgd: WindowGroupData? // Optional, could be null
}

// Define sceneMap type
typealias SceneMap = [String: SceneData]

// Define SceneMgr class
class SceneMgr {
    static var Instance: SceneMgr! // Singleton instance
    private var sceneMap: SceneMap = [:] // Store the scene mappings
    private var webViewToSceneMap: [WKWebView: String] = [:] // WKWebView to sceneName mapping

    private let logger = Logger.getLogger()
    // Holder for the creating class
    private(set) var parent: web_spatialApp?

    // Initialize with the creator
    init(creator: web_spatialApp) {
        parent = creator
    }

    // Set up the singleton instance with a creator
    static func initInstance(_ creator: web_spatialApp) {
        guard Instance == nil else {
            // SceneMgr instance already exists
            return
        }
        Instance = SceneMgr(creator: creator)
    }

    // Add mapping between WKWebView and sceneName
    private func addWebViewToSceneMapping(webView: WKWebView, sceneName: String) {
        webViewToSceneMap[webView] = sceneName
    }

    // Remove mapping for a WKWebView
    private func removeWebViewToSceneMapping(webView: WKWebView) {
        webViewToSceneMap.removeValue(forKey: webView)
    }

    // Get config for a specific scene
    func getConfig(sceneName: String) -> Config? {
        return sceneMap[sceneName]?.config
    }

    // Get all scene configs
    func getConfig() -> [String: Config] {
        return sceneMap.reduce(into: [String: Config]()) { result, entry in
            result[entry.key] = entry.value.config
        }
    }

    // Set scene config
    func setConfig(sceneName: String, cfg: Config) -> Bool {
        // Ensure existing ones can't be changed if wgd already exists
        if let scene = sceneMap[sceneName], scene.wgd != nil {
            // If the scene exists and has a non-nil wgd, prevent modification
            return false
        }

        if sceneMap[sceneName] == nil {
            sceneMap[sceneName] = SceneData(config: cfg, wgd: nil)
        } else {
            sceneMap[sceneName]?.config = cfg
        }

        return true
    }

    // Delete scene config
    func delConfig(sceneName: String) -> Bool {
        // Ensure existing ones can't be deleted if the scene is currently open
        guard let scene = sceneMap[sceneName], scene.wgd == nil else {
            // If the scene exists and has an associated wgd, prevent deletion
            return false
        }
        sceneMap.removeValue(forKey: sceneName)
        return true
    }

    // Open scene
    func open(sceneName: String, url: String, from: SpatialWindowComponent, windowID: String?) -> Bool {
        guard var scene = sceneMap[sceneName] else {
            // sceneName does not exist
            return false
        }

        // if scene already opened, navigate to new url
        if scene.wgd != nil {
            let wgid = scene.wgd!.windowGroupID
            let wg = SpatialWindowGroup
                .getOrCreateSpatialWindowGroup(wgid)
            let rootEntity = wg!.getEntities().filter {
                $0.value.getComponent(SpatialWindowComponent.self) != nil && $0.value.coordinateSpace == .ROOT
            }.first?.value

            if let wv = rootEntity?.getComponent(SpatialWindowComponent.self) {
                wv.navigateToURL(url: URL(string: url)!)
                // bring to focus
                parent?.rootWGD.openWindowData.send(scene.wgd!)
                return true
            } else {
                return false
            }
        }

        // Logic for opening the scene

        let config = scene.config

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
            WindowGroupModel.Instance.update(plainDV) // set default values
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                pwg.openWindowData.send(wgd) // openwindow
            }
        }

        // save wgd
        scene.wgd = wgd
        sceneMap[sceneName] = scene

        // create EC
        let ent = SpatialEntity()
        ent.coordinateSpace = CoordinateSpaceMode.ROOT
        let windowComponent = SpatialWindowComponent(
            parentWindowGroupID: windowGroupID
        )

        // attach spawned webview to windowComponent
        if let windowID: String = windowID {
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
        } else {
            logger.error("no windowID")
            return false
        }
        ent.addComponent(windowComponent)

        let isFirstCreate = SpatialWindowGroup.getSpatialWindowGroup(windowGroupID) == nil

        let wg = SpatialWindowGroup
            .getOrCreateSpatialWindowGroup(windowGroupID)

        if isFirstCreate {
            // before view destroy do some clean up
            wg!.on(event: SpatialObject.Events.BeforeDestroyed.rawValue, listener: { _, _ in
                windowComponent
                    .getView()?.webViewHolder.appleWebView?
                    .evaluateJavaScript("window.close()") // fire close event
            })
            wg!.on(event: SpatialObject.Events.Destroyed.rawValue, listener: { _, _ in
                self.delScene(sceneName)
            })
        }

        ent.setParentWindowGroup(wg: wg)

        // save webview->sceneName map
        addWebViewToSceneMapping(
            webView: windowComponent.getView()!.webViewHolder.appleWebView!,
            sceneName: sceneName
        )

        return true
    }

    // Close scene
    func close(sceneName: String) -> Bool {
        guard let scene = sceneMap[sceneName] else {
            // sceneName does not exist
            return false
        }
        // Logic for closing the scene
        if let wgd = scene.wgd {
            parent?.rootWGD.closeWindowData.send(wgd)
            return true
        } else {
            // scene not opened yet
            return false
        }
    }

    // Close a scene by WKWebView
    func close(_ webView: WKWebView) -> Bool {
        guard let sceneName = webViewToSceneMap[webView] else {
            logger.error("No scene found for the provided WKWebView")
            return false
        }

        if close(sceneName: sceneName) {
            removeWebViewToSceneMapping(webView: webView)
            return true
        } else {
            logger.error("Failed to close scene \(sceneName)")
            return false
        }
    }

    // Get scene names with wgd (if name is provided and wgd exists, return the scene name; else, return nil)
    func getScene(sceneName: String) -> String? {
        if let scene = sceneMap[sceneName], scene.wgd != nil {
            return sceneName
        } else {
            return nil
        }
    }

    // Set scene wgd to nil
    func delScene(_ sceneName: String) {
        if var scene = sceneMap[sceneName] {
            scene.wgd = nil
            sceneMap[sceneName] = scene // save
        }
    }

    // Get all scene names with wgd
    func getScene() -> [String] {
        return sceneMap.filter { $0.value.wgd != nil }.map { $0.key }
    }
}
