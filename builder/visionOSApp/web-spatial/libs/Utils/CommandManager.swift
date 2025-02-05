//
//  CommandManager.swift
//  web-spatial
//
//  Created by ByteDance on 2024/10/15.
//
import Foundation
import RealityKit
import SwiftUI

class CommandManager {
    static let Instance = CommandManager()

    private let decoder = JSONDecoder()
    private var commandList: [String: (_ target: SpatialWindowComponent, _ jsb: JSBCommand, _ info: CommandInfo) -> Void] = [:]
    private init() {
        _ = registerCommand(name: "multiCommand", action: multiCommand)
        _ = registerCommand(name: "ping", action: ping)
        _ = registerCommand(name: "inspect", action: inspect)
        _ = registerCommand(name: "getStats", action: getStats)
        _ = registerCommand(name: "setComponent", action: setComponent)
        _ = registerCommand(name: "removeComponent", action: removeComponent)
        _ = registerCommand(name: "createResource", action: createResource)
        _ = registerCommand(name: "destroyResource", action: destroyResource)
        _ = registerCommand(name: "updateResource", action: updateResource)
        _ = registerCommand(name: "createWindowGroup", action: createWindowGroup)
        _ = registerCommand(name: "updateWindowGroup", action: updateWindowGroup)
        _ = registerCommand(name: "openImmersiveSpace", action: openImmersiveSpace)
        _ = registerCommand(name: "dismissImmersiveSpace", action: dismissImmersiveSpace)
        _ = registerCommand(name: "log", action: log)
    }

    private func getInfo(_ target: SpatialWindowComponent, _ jsb: JSBCommand) -> CommandInfo? {
        var ret = CommandInfo()
        ret.requestID = jsb.requestID
        if let windowGroupID = jsb.data?.windowGroupID {
            ret.windowGroupID = target.readWinodwGroupID(id: windowGroupID) // windowGroupID
        }
        if let entityID = jsb.data?.entityID {
            ret.entityID = entityID
        }
        if let resourceID = jsb.data?.resourceID {
            ret.resourceID = resourceID
        }
        if ret.resourceID == "current" {
            ret.resourceID = target.id
        }
        return ret
    }

    public func registerCommand(name: String, action: @escaping (_ target: SpatialWindowComponent, _ jsb: JSBCommand, _ info: CommandInfo) -> Void) -> Bool {
        if commandList[name] == nil {
            commandList[name] = action
            return true
        }
        return false
    }

    public func decode(jsonData: String) -> JSBCommand {
        var jsbCommand = JSBCommand(command: "", data: JSData(), requestID: 0)
        do {
            jsbCommand = try decoder.decode(JSBCommand.self, from: jsonData.data(using: .utf8)!)
        } catch {
//            print(error)
        }
        return jsbCommand
    }

    public func doCommand(target: SpatialWindowComponent, jsb: JSBCommand) {
//        print("do command:", jsb.command)
        if let action = commandList[jsb.command] {
//            print("action command:", jsb.command)
            if let info = getInfo(target, jsb) {
                action(target, jsb, info)
            }
        }
    }

    private func multiCommand(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        for subCommand in jsb.data!.commandList! {
            doCommand(target: target, jsb: subCommand)
        }
        target.completeEvent(requestID: info.requestID)
    }

    private func ping(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        target.completeEvent(requestID: info.requestID, data: "{ping: 'Complete'}")
    }

    private func inspect(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        if let spatialObject = SpatialObject.getRefObject(info.resourceID) {
            let inspectInfo = spatialObject.inspect()
            let isValidJSON = JSONSerialization.isValidJSONObject(inspectInfo)
            if isValidJSON {
                do {
                    let jsonData = try JSONSerialization.data(withJSONObject: inspectInfo, options: [])
                    let jsonString = String(data: jsonData, encoding: .utf8)
                    target.completeEvent(requestID: jsb.requestID, data: jsonString ?? "Conver failed")
                } catch {
                    print("Error: \(error.localizedDescription)")
                    target.completeEvent(requestID: jsb.requestID, data: """
                    error: \(error.localizedDescription)
                    """)
                }
            } else {
                print(inspectInfo)
            }
        } else {
            print("Missing spatialObject resource")
            return
        }
    }

    private func getStats(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        let statsInfo = SpatialObject.stats()
        do {
            let jsonData = try JSONEncoder().encode(statsInfo)
            let jsonString = String(data: jsonData, encoding: .utf8)
            target.completeEvent(requestID: jsb.requestID, data: jsonString ?? "Conver failed")
        } catch {
            print("Error: \(error.localizedDescription)")
            target.completeEvent(requestID: jsb.requestID, data: """
            error: \(error.localizedDescription)
            """)
        }
    }

    private func setComponent(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        if let component = target.getChildSpatialObject(name: info.resourceID) as? SpatialComponent,
           let entity = target.getChildSpatialObject(name: jsb.data!.entityID!) as? SpatialEntity
        {
            entity.addComponent(component)
        } else {
            print("missing resource, setComponent not processed")
        }
    }

    private func removeComponent(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        if let component = target.getChildSpatialObject(name: info.resourceID) as? SpatialComponent,
           let entity = target.getChildSpatialObject(name: jsb.data!.entityID!) as? SpatialEntity
        {
            entity.removeComponent(component)
        } else {
            print("missing resource, removeComponent not processed")
        }
    }

    private func createResource(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        CommandDataManager.Instance.createResource(target: target, requestID: jsb.requestID, data: jsb.data!)
    }

    private func destroyResource(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        let resourceID = info.resourceID
        target.destroyChild(name: resourceID)
    }

    private func updateResource(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        CommandDataManager.Instance.updateResource(target: target, requestID: jsb.requestID, resourceID: info.resourceID, data: jsb.data!)
    }

    private func createWindowGroup(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        CommandDataManager.Instance.createWindowGroup(target: target, requestID: jsb.requestID, data: jsb.data!)
    }

    private func updateWindowGroup(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        CommandDataManager.Instance.updateWindowGroup(target: target, requestID: jsb.requestID, data: jsb.data!)
    }

    private func openImmersiveSpace(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        print("openImmersiveSpace")
        SpatialWindowGroup.getRootWindowGroup().toggleImmersiveSpace.send(true)
    }

    private func dismissImmersiveSpace(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        print("dismissImmersiveSpace")
        SpatialWindowGroup.getRootWindowGroup().toggleImmersiveSpace.send(false)
    }

    private func log(target: SpatialWindowComponent, jsb: JSBCommand, info: CommandInfo) {
        CommandDataManager.Instance.log(data: jsb.data!)
    }
}

class CommandDataManager {
    static let Instance = CommandDataManager()

    public func createResource(target: SpatialWindowComponent, requestID: Int, data: JSData) {
        if let type = data.type {
            var sr: SpatialObject?
            switch type {
            case "Entity":
                sr = SpatialEntity()
            case "InputComponent":
                sr = SpatialInputComponent()
                (sr as! SpatialInputComponent).wv = target
            case "MeshResource":
                if let shape = data.params?.shape {
                    let meshResource: MeshResource = shape == "sphere" ? .generateSphere(radius: 0.5) : .generateBox(size: 1.0)
                    sr = SpatialMeshResource(meshResource)
                }
            case "PhysicallyBasedMaterial":
                sr = SpatialPhysicallyBasedMaterial(PhysicallyBasedMaterial())
            case "SpatialWebView":
                sr = SpatialWindowComponent(parentWindowGroupID: target.readWinodwGroupID(id: data.windowGroupID!))
                let spatialWindowComponent = sr as! SpatialWindowComponent
                spatialWindowComponent.parentWebviewID = target.id
            case "SpatialView":
                sr = SpatialViewComponent()
            case "Model3DComponent":
                let spatialModel3DComponent = SpatialModel3DComponent()
                if let modelURL: String = data.params?.modelURL {
                    spatialModel3DComponent.setURL(modelURL)
                }
                sr = spatialModel3DComponent
            case "ModelComponent":
                if var modelURL: String = data.params?.modelURL {
                    modelURL = target.parseURL(url: modelURL)
                    // Create download task for the url
                    let url = URL(string: modelURL)!
                    let downloadSession = URLSession(configuration: URLSession.shared.configuration, delegate: nil, delegateQueue: nil)
                    let downloadTask = downloadSession.downloadTask(with: url, completionHandler: { a, _, _ in
                        // Copy temp file to documentes directory
                        let fileStr = modelURL.replacingOccurrences(of: ":", with: "__").replacingOccurrences(of: "/", with: "_x_")
                        do {
                            let fileURL = getDocumentsDirectory().appendingPathComponent(fileStr)
                            try FileManager.default.copyItem(at: a!, to: fileURL)
                            print("Downloaded and copied model")
                        } catch {
                            print("Model already exists")
                        }

                        Task {
                            do {
                                let m = try await ModelEntity(contentsOf: getDocumentsDirectory().appendingPathComponent(fileStr))

                                let modelComponent = await m.model!
                                let spatialModelComponent = SpatialModelComponent(modelComponent)

                                Task.detached { @MainActor in
                                    // Update state on main thread
                                    target.completeEvent(requestID: requestID, data: "{createdID: '" + spatialModelComponent.id + "'}")
                                    target.addChildSpatialObject(spatialModelComponent)
                                    print("Model load success!")
                                }
                            } catch {
                                print("failed to load model: " + error.localizedDescription)
                            }
                        }
                    })
                    downloadTask.resume()
                    return
                } else {
                    let modelComponent = ModelComponent(mesh: .generateBox(size: 0.0), materials: [])
                    sr = SpatialModelComponent(modelComponent)
                }
            default: print("failed to create sr of type", type)
            }
            if let srObject = sr {
                target.completeEvent(requestID: requestID, data: "{createdID: '" + srObject.id + "'}")
                target.addChildSpatialObject(srObject)
            } else {
                print("failed to create sr of type", type)
            }
        }
    }

    public func updateResource(target: SpatialWindowComponent, requestID: Int, resourceID: String, data: JSData) {
        var delayComplete = false
        if SpatialObject.get(resourceID) == nil {
            print("Missing resource:" + resourceID)
            return
        }
        let sr = SpatialObject.get(resourceID)!
        if let entity = sr as? SpatialEntity {
            if let setParentID: String = data.update?.setParent {
                if setParentID.isEmpty {
                    entity.setParent(parentEnt: nil)
                } else {
                    if let parentEntity = SpatialObject.get(setParentID) as? SpatialEntity {
                        entity.setParent(parentEnt: parentEntity)
                    } else {
                        print("Invalid setParentID", setParentID)
                    }
                }
            }

            if let _ = data.update?.getBoundingBox {
                var b = entity.modelEntity.visualBounds(relativeTo: nil)
                var exts = "x:" + String(b.extents.x) + "," + "y:" + String(b.extents.y) + "," + "z:" + String(b.extents.z)
                var center = "x:" + String(b.center.x) + "," + "y:" + String(b.center.y) + "," + "z:" + String(b.center.z)
                target.completeEvent(requestID: requestID, data: "{center: {" + center + "}, extents: {" + exts + "}}")
                return
            }

            if let name = data.update?.name {
                entity.name = name
            }

            if let space: String = data.update?.setCoordinateSpace {
                entity.coordinateSpace = .APP
                if space == "Root" {
                    entity.coordinateSpace = .ROOT
                }

                if space == "Dom" {
                    entity.coordinateSpace = .DOM
                }
            }

            if let zIndex: Double = data.update?.zIndex {
                entity.zIndex = zIndex
            }

            if let visible: Bool = data.update?.visible {
                entity.visible = visible
            }

            if var newParentID: String = data.update?.setParentWindowGroupID {
                newParentID = target.readWinodwGroupID(id: newParentID)
                let wg = SpatialWindowGroup.getSpatialWindowGroup(newParentID)
                entity.setParentWindowGroup(wg: wg)
            }

            if let position: JSVector3F = data.update?.position,
               let scale: JSVector3F = data.update?.scale,
               let orientation: JSVector4 = data.update?.orientation
            {
                entity.modelEntity.position = SIMD3<Float>(position.x, position.y, position.z)
                entity.modelEntity.scale = SIMD3<Float>(scale.x, scale.y, scale.z)
                entity.modelEntity.orientation.vector = SIMD4<Float>(orientation.x, orientation.y, orientation.z, orientation.w)
                entity.forceUpdate = !entity.forceUpdate
            }
        } else if sr is SpatialMeshResource {
        } else if let spatialPhysicallyBasedMaterial = sr as? SpatialPhysicallyBasedMaterial {
            if let baseColor: JSColor = data.update?.baseColor {
                spatialPhysicallyBasedMaterial.physicallyBasedMaterial.baseColor = PhysicallyBasedMaterial.BaseColor(tint: UIColor(red: baseColor.r, green: baseColor.g, blue: baseColor.b, alpha: baseColor.a))
            }

            if let roughness: Double = data.update?.roughness?.value {
                spatialPhysicallyBasedMaterial.physicallyBasedMaterial.roughness = PhysicallyBasedMaterial.Roughness(floatLiteral: Float(roughness))
            }

            if let metallic: Double = data.update?.metallic?.value {
                spatialPhysicallyBasedMaterial.physicallyBasedMaterial.metallic = PhysicallyBasedMaterial.Metallic(floatLiteral: Float(metallic))
            }

        } else if let spatialViewComponent = sr as? SpatialViewComponent {
            if let resolution = data.update?.resolution {
                spatialViewComponent.resolutionX = resolution.x
                spatialViewComponent.resolutionY = resolution.y
            }

            if let isPortal = data.update?.isPortal {
                spatialViewComponent.isPortal = isPortal
            }

        } else if let spatialModelComponent = sr as? SpatialModelComponent {
            if let meshResourceId: String = data.update?.meshResource {
                if let spatialMeshResource = target.getChildSpatialObject(name: meshResourceId) as? SpatialMeshResource {
                    spatialModelComponent.modelComponent.mesh = spatialMeshResource.meshResource
                } else {
                    print("invalid  meshResource")
                }
            }

            if let materials: [String] = data.update?.materials {
                spatialModelComponent.modelComponent.materials = []
                for matID in materials {
                    if let spatialMaterialComponent = target.getChildSpatialObject(name: matID) as? SpatialPhysicallyBasedMaterial {
                        spatialModelComponent.modelComponent.materials.append(spatialMaterialComponent.physicallyBasedMaterial)
                    }
                }
            }
            spatialModelComponent.onUpdate()
        } else if let spatialModel3DComponent = sr as? SpatialModel3DComponent {
            if let resolution: JSVector2 = data.update?.resolution {
                spatialModel3DComponent.resolutionX = resolution.x
                spatialModel3DComponent.resolutionY = resolution.y
            }

            if let rotationAnchor = data.update?.rotationAnchor {
                spatialModel3DComponent.rotationAnchor = UnitPoint3D(
                    x: rotationAnchor.x,
                    y: rotationAnchor.y,
                    z: rotationAnchor.z
                )
            }

            if let opacity = data.update?.opacity {
                spatialModel3DComponent.opacity = opacity
            }

        } else if let spatialWindowComponent = sr as? SpatialWindowComponent {
            if let _: String = data.update?.getEntityID {
                if let entity: SpatialEntity = spatialWindowComponent.entity {
                    target.completeEvent(requestID: requestID, data: "{parentID:'" + entity.id + "'}")

                } else {
                    target.completeEvent(requestID: requestID, data: "{parentID:''}")
                }
                return
            }

            if let _: String = data.update?.getParentID {
                target.completeEvent(requestID: requestID, data: "{parentID:'" + spatialWindowComponent.parentWebviewID + "'}")
                return
            }

            if let scrollEnabled: Bool = data.update?.scrollEnabled {
                if !scrollEnabled {
                    spatialWindowComponent.getView()!.webViewHolder.appleWebView!.scrollView.contentOffset.y = 0
                    spatialWindowComponent.getView()!.webViewHolder.appleWebView!.scrollView.isScrollEnabled = false
                } else {
                    spatialWindowComponent.getView()!.webViewHolder.appleWebView!.scrollView.isScrollEnabled = true
                }
            }

            if let rect: JSRect = data.update?.setScrollEdgeInsets {
                spatialWindowComponent.getView()!.webViewHolder.appleWebView!.scrollView.contentInset = UIEdgeInsets(top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right)
            }

            if let scrollWithParent: Bool = data.update?.scrollWithParent {
                spatialWindowComponent.scrollWithParent = scrollWithParent
            }

            if let windowID: String = data.update?.windowID {
                if let spawnedWebView = target.spawnedNativeWebviews.removeValue(forKey: windowID) {
                    spatialWindowComponent.getView()!.destroy()
                    spatialWindowComponent.setView(wv: spawnedWebView)
                    spatialWindowComponent.getView()!.webViewHolder.webViewCoordinator!.webViewRef = spatialWindowComponent
                }
            }

            if let url: String = data.update?.url {
                // Compute target url depending if the url is relative or not
                let targetUrl = target.parseURL(url: url)

                delayComplete = true
                if spatialWindowComponent.loadRequestID == -1 {
                    spatialWindowComponent.loadRequestID = requestID
                    spatialWindowComponent.loadRequestWV = target
                    spatialWindowComponent.setURL(url: URL(string: targetUrl)!)
                    spatialWindowComponent.getView()!.initialLoad()
                } else {
                    target.failEvent(requestID: requestID)
                }
            }

            if let resolution: JSVector2 = data.update?.resolution {
                spatialWindowComponent.resolutionX = resolution.x
                spatialWindowComponent.resolutionY = resolution.y
            }

            if let rotationAnchor = data.update?.rotationAnchor {
                spatialWindowComponent.rotationAnchor = UnitPoint3D(
                    x: rotationAnchor.x,
                    y: rotationAnchor.y,
                    z: rotationAnchor.z
                )
            }

            if let opacity = data.update?.opacity {
                spatialWindowComponent.opacity = opacity
            }

            if let backgroundMaterial: BackgroundMaterial = data.update?.style?.backgroundMaterial {
                if target.isLoading {
                    target.loadingStyles.backgroundMaterial = backgroundMaterial
                }
                spatialWindowComponent.backgroundMaterial = backgroundMaterial
            }
            if let cornerRadius: CornerRadius = data.update?.style?.cornerRadius {
                if target.isLoading {
                    target.loadingStyles.cornerRadius = cornerRadius
                }
                spatialWindowComponent.cornerRadius = cornerRadius
            }
            spatialWindowComponent.gotStyle = true
        }
        if !delayComplete {
            target.completeEvent(requestID: requestID)
        }
    }

    public func createWindowGroup(target: SpatialWindowComponent, requestID: Int, data: JSData) {
        if let windowStyle: String = data.windowStyle {
            // windowID exist in SWC

            // TODO: check url scope
            // in scope: the url is configured in manifest
            // if not in scope, open in safari

            let fakeData = "{createdID: 'uuid'}"

            if data.sceneData?.method == "createRoot" {
                if let windowID = data.sceneData?.windowID {
                    // if windowID in spawned uuid, createRoot

                    if target.spawnedNativeWebviews[windowID] != nil {
                        // setup windowGroup defaultValues
                        if let config = data.sceneData?.sceneConfig {
                            target.createRoot(windowID: windowID, config: config)
                        } else {
                            target.createRoot(windowID: windowID)
                        }

                    } else {
                        // TODO: search for the swc with windowID
                        // call focusRoot
                    }

                    target.completeEvent(requestID: requestID, data: fakeData)
                    return
                }
            } else if data.sceneData?.method == "showRoot" {
                if let config = data.sceneData?.sceneConfig {
                    target.showRoot(config: config)
                }
                target.completeEvent(requestID: requestID, data: fakeData)
                return
            }

            let uuid = UUID().uuidString
            let wgd = WindowGroupData(windowStyle: windowStyle, windowGroupID: uuid)

            // Force window group creation to happen now so it can be accessed after complete event returns
            _ = SpatialWindowGroup.getOrCreateSpatialWindowGroup(uuid)

            SpatialWindowGroup.getRootWindowGroup().openWindowData.send(wgd)
            target.setWindowGroup(uuid: uuid, wgd: wgd)
            target.completeEvent(requestID: requestID, data: "{createdID: '" + uuid + "'}")
        }
    }

    public func updateWindowGroup(target: SpatialWindowComponent, requestID: Int, data: JSData) {
        if let getRootEntityID = data.update?.getRootEntityID,
           let wg = SpatialWindowGroup.getSpatialWindowGroup(target.readWinodwGroupID(id: data.windowGroupID!))
        {
            let rootEntity = wg.getEntities().filter {
                $0.value.coordinateSpace == .ROOT
            }.first?.value
            if rootEntity != nil {
                target.completeEvent(requestID: requestID, data: "{rootEntId:'" + rootEntity!
                    .id + "'}")
            } else {
                target.completeEvent(requestID: requestID, data: "{rootEntId:''}")
            }
            return
        }

        if let dimensions = data.update?.style?.dimensions,
           let wg = SpatialWindowGroup.getSpatialWindowGroup(target.readWinodwGroupID(id: data.windowGroupID!))
        {
            target.loadingStyles.windowGroupSize = CGSize(width: dimensions.x, height: dimensions.y)
            wg.setSize.send(target.loadingStyles.windowGroupSize)
        }
        target.completeEvent(requestID: requestID)
    }

    public func log(data: JSData) {
        if let logStringArr: [String] = data.logString {
            let logString = logStringArr.joined()
            print(logString)
        }
    }
}

struct JSBCommand: Codable {
    var command: String
    var data: JSData?
    var requestID: Int
}

struct JSData: Codable {
    var commandList: [JSBCommand]? // multiCommand
    var resourceID: String?
    var windowGroupID: String?
    var entityID: String? // setComponent
    var type: String? // createResource
    var params: JSParams? // createResource
    var update: JSResourceData?
    var windowStyle: String?
    var windowGroupOptions: WindowGroupOptions?
    var sceneData: SceneJSBData?
    var logString: [String]?
    var logLevel: String?
}

struct JSParams: Codable {
    var shape: String?
    var modelURL: String?
}

struct JSResourceData: Codable {
    var setParent: String?
    var setCoordinateSpace: String?
    var setParentWindowGroupID: String?
    var position: JSVector3F?
    var orientation: JSVector4?
    var scale: JSVector3F?
    var baseColor: JSColor?
    var roughness: JSValue?
    var metallic: JSValue?
    var url: String?
    var aspectRatio: String?
    var opacity: Double?
    var resolution: JSVector2?
    var isPortal: Bool?
    var rotationAnchor: JSVector3?
    var meshResource: String?
    var materials: [String]?
    var getEntityID: String?
    var getParentID: String?
    var getRootEntityID: String?
    var scrollEnabled: Bool?
    var scrollWithParent: Bool?
    var setScrollEdgeInsets: JSRect?
    var windowID: String?
    var style: JSEntityStyle?
    var getBoundingBox: Bool?
    var zIndex: Double?
    var visible: Bool?
    var name: String?
}

struct JSColor: Codable {
    var r: Double
    var g: Double
    var b: Double
    var a: Double
}

struct JSVector2: Codable {
    var x: Double
    var y: Double
}

struct JSVector3: Codable {
    var x: Double
    var y: Double
    var z: Double
}

struct JSVector3F: Codable {
    var x: Float
    var y: Float
    var z: Float
}

struct JSVector4: Codable {
    var x: Float
    var y: Float
    var z: Float
    var w: Float
}

struct JSValue: Codable {
    var value: Double
}

struct JSRect: Codable {
    var top: Double
    var bottom: Double
    var left: Double
    var right: Double
}

struct JSEntityStyle: Codable {
    var cornerRadius: CornerRadius?
    var backgroundMaterial: BackgroundMaterial?
    var dimensions: JSVector2?
}

struct SceneJSBData: Codable {
    var method: String?
    var sceneName: String?
    var sceneConfig: WindowGroupOptions?
    var url: String?
    var windowID: String?
}
