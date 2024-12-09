//
//  SceneMgr.swift
//  web-spatial
//
//  Created by ByteDance on 2024/12/2.
//

import UIKit

typealias Config = WindowGroupOptions

struct SceneJSBData: Codable {
    var method: String?
    var sceneName: String?
    var sceneConfig: Config?
    var url: String?
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
    func open(sceneName: String, url: String) -> Bool {
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
        parent?.rootWGD.setWindowGroupPlainDefaultValues.send(plainDV)

        let windowGroupID = UUID().uuidString
        // open window
        let wgd = WindowGroupData(
            windowStyle: "Plain",
            windowGroupID: windowGroupID
        )
        parent?.rootWGD.openWindowData
            .send(wgd)

        // save wgd
        scene.wgd = wgd
        sceneMap[sceneName] = scene

        // create EC
        let ent = SpatialEntity()
        ent.coordinateSpace = CoordinateSpaceMode.ROOT
        let windowComponent = SpatialWindowComponent(
            parentWindowGroupID: windowGroupID,
            url: URL(string: url)!
        )
        ent.addComponent(windowComponent)
        let existing = SpatialWindowGroup.getSpatialWindowGroup(windowGroupID)
        let isFirstCreate = existing == nil

        let wg = SpatialWindowGroup
            .getOrCreateSpatialWindowGroup(windowGroupID)

        if isFirstCreate {
            wg!.on(event: "closed", listener: { _, _ in
                self.delScene(sceneName)
            })
        }

        ent.setParentWindowGroup(wg: wg)

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
            delScene(sceneName)
            return true
        } else {
            // scene not opened yet
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
