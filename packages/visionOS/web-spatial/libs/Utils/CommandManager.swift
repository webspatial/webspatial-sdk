import Foundation
import RealityKit
import SwiftUI

struct CommandInfo {
    var windowContainerID = "notFound"
    var entityID = "notFound"
    var resourceID = "notFound"
    var requestID = -1
    var cmd: JSBCommand
}

class CommandManager {
    static let Instance = CommandManager()

    private let decoder = JSONDecoder()
    private var commandList: [String: (_ target: SpatialWindowComponent, _ info: CommandInfo) -> Void] = [:]
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
        _ = registerCommand(name: "createWindowContainer", action: createWindowContainer)
        _ = registerCommand(name: "updateWindowContainer", action: updateWindowContainer)
        _ = registerCommand(name: "openImmersiveSpace", action: openImmersiveSpace)
        _ = registerCommand(name: "dismissImmersiveSpace", action: dismissImmersiveSpace)
        _ = registerCommand(name: "log", action: log)
        _ = registerCommand(name: "createScene", action: createScene)
        _ = registerCommand(name: "setLoading", action: setLoading)
    }

    private func getInfo(_ target: SpatialWindowComponent, _ jsb: RawJSBCommand) -> CommandInfo? {
        var ret = CommandInfo(cmd: JSBCommand(command: jsb.command, data: jsb.data, requestID: jsb.requestID))
        ret.requestID = jsb.requestID
        if let windowContainerID = jsb.data?.windowContainerID {
            ret.windowContainerID = target.readWindowContainerID(id: windowContainerID)
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

    private func registerCommand(name: String, action: @escaping (_ target: SpatialWindowComponent, _ info: CommandInfo) -> Void) -> Bool {
        if commandList[name] == nil {
            commandList[name] = action
            return true
        }
        return false
    }

    public func decode(jsonData: String) -> RawJSBCommand {
        var jsbCommand = RawJSBCommand(command: "", data: RawJSData(), requestID: 0)
        do {
            jsbCommand = try decoder.decode(RawJSBCommand.self, from: jsonData.data(using: .utf8)!)
        } catch {
            logger.error("\(error)")
        }
        return jsbCommand
    }

    public func doCommand(target: SpatialWindowComponent, jsb: RawJSBCommand) {
        if let action = commandList[jsb.command] {
            if let info = getInfo(target, jsb) {
                action(target, info)
            }
        }
    }

    private func multiCommand(target: SpatialWindowComponent, info: CommandInfo) {
        for subCommand in info.cmd.data!.commandList! {
            doCommand(target: target, jsb: subCommand)
        }
        target.completeEvent(requestID: info.requestID)
    }

    private func ping(target: SpatialWindowComponent, info: CommandInfo) {
        target.completeEvent(requestID: info.requestID, data: "{ping: 'Complete'}")
    }

    private func inspect(target: SpatialWindowComponent, info: CommandInfo) {
        if let spatialObject = SpatialObject.getRefObject(info.resourceID) {
            let inspectInfo = spatialObject.inspect()
            let isValidJSON = JSONSerialization.isValidJSONObject(inspectInfo)
            if isValidJSON {
                do {
                    let jsonData = try JSONSerialization.data(withJSONObject: inspectInfo, options: [])
                    let jsonString = String(data: jsonData, encoding: .utf8)
                    target.completeEvent(requestID: info.requestID, data: jsonString ?? "Conver failed")
                } catch {
                    logger.error("Error: \(error.localizedDescription)")
                    target.completeEvent(requestID: info.requestID, data: """
                    error: \(error.localizedDescription)
                    """)
                }
            } else {
                logger.warning("\(inspectInfo)")
            }
        } else {
            logger.warning("Missing spatialObject resource")
            return
        }
    }

    private func getStats(target: SpatialWindowComponent, info: CommandInfo) {
        let statsInfo = SpatialObject.stats()
        do {
            let jsonData = try JSONEncoder().encode(statsInfo)
            let jsonString = String(data: jsonData, encoding: .utf8)
            target.completeEvent(requestID: info.requestID, data: jsonString ?? "Conver failed")
        } catch {
            logger.error("Error: \(error.localizedDescription)")
            target.completeEvent(requestID: info.requestID, data: """
            error: \(error.localizedDescription)
            """)
        }
    }

    private func setComponent(target: SpatialWindowComponent, info: CommandInfo) {
        if let component = SpatialObject.get(info.resourceID) as? SpatialComponent,
           let entity = SpatialObject.get(info.entityID) as? SpatialEntity
        {
            entity.addComponent(component)
        } else {
            logger.warning("missing resource, setComponent not processed")
        }
    }

    private func removeComponent(target: SpatialWindowComponent, info: CommandInfo) {
        if let component = target.getChildSpatialObject(name: info.resourceID) as? SpatialComponent,
           let entity = target.getChildSpatialObject(name: info.entityID) as? SpatialEntity
        {
            entity.removeComponent(component)
        } else {
            logger.warning("missing resource, removeComponent not processed")
        }
    }

    private static func setParentResourceDependencies(object: SpatialObject, info: CommandInfo) {
        if let parentWindowComponent = SpatialObject.get(info.resourceID) as? SpatialWindowComponent {
            parentWindowComponent.addChildSpatialObject(object)
        }
        if let parentWindowContainer = SpatialWindowContainer.getSpatialWindowContainer(info.windowContainerID) {
            parentWindowContainer.addChildResource(object)
        }
    }

    private func createResource(target: SpatialWindowComponent, info: CommandInfo) {
        let data = info.cmd.data!
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
                if let parentWindowContainer = SpatialWindowContainer.getSpatialWindowContainer(info.windowContainerID) {
                    sr = SpatialWindowComponent(parentWindowContainerID: parentWindowContainer.id)
                    let spatialWindowComponent = sr as! SpatialWindowComponent
                    spatialWindowComponent.parentWebviewID = target.id
                }
            case "SpatialView":
                sr = SpatialViewComponent()
            case "Model3DComponent":
                let spatialModel3DComponent = SpatialModel3DComponent()
                if let modelURL: String = data.params?.modelURL {
                    spatialModel3DComponent.setURL(modelURL)
                }
                sr = spatialModel3DComponent
                spatialModel3DComponent.wv = target
            case "ModelComponent":
                if var modelURL: String = data.params?.modelURL {
                    modelURL = target.parseURL(url: modelURL)
                    // Create download task for the url
                    let url = URL(string: modelURL)!
                    let downloadSession = URLSession(configuration: URLSession.shared.configuration, delegate: nil, delegateQueue: nil)
                    let downloadTask = downloadSession.downloadTask(with: url, completionHandler: { a, _, _ in
                        var fileURL = url
                        if !pwaManager.isLocal {
                            // Copy temp file to documentes directory
                            let fileStr = modelURL.replacingOccurrences(of: ":", with: "__").replacingOccurrences(of: "/", with: "_x_")
                            do {
                                fileURL = getDocumentsDirectory().appendingPathComponent(fileStr)
                                try FileManager.default.copyItem(at: a!, to: fileURL)
                                logger.debug("Downloaded and copied model")
                            } catch {
                                logger.warning("Model already exists")
                            }
                        }

                        Task {
                            do {
                                let m = try await ModelEntity(contentsOf: fileURL)

                                let modelComponent = await m.model!
                                let spatialModelComponent = SpatialModelComponent(modelComponent)

                                Task.detached { @MainActor in
                                    // Update state on main thread
                                    CommandManager.setParentResourceDependencies(object: spatialModelComponent, info: info)
                                    target.completeEvent(requestID: info.requestID, data: "{createdID: '" + spatialModelComponent.id + "'}")
                                    logger.debug("Model load success!")
                                }
                            } catch {
                                logger.warning("failed to load model: " + error.localizedDescription)
                            }
                        }
                    })
                    downloadTask.resume()
                    return
                } else {
                    let modelComponent = ModelComponent(mesh: .generateBox(size: 0.0), materials: [])
                    sr = SpatialModelComponent(modelComponent)
                }
            default: logger.warning("failed to create sr of type \(type)")
            }
            if let srObject = sr {
                CommandManager.setParentResourceDependencies(object: srObject, info: info)
                target.completeEvent(requestID: info.requestID, data: "{createdID: '" + srObject.id + "'}")
            } else {
                logger.warning("failed to create sr of type: \(type)")
            }
        }
    }

    private func destroyResource(target: SpatialWindowComponent, info: CommandInfo) {
        let resourceID = info.resourceID
        target.destroyChild(name: resourceID)
    }

    private func updateResource(target: SpatialWindowComponent, info: CommandInfo) {
        let data = info.cmd.data!
        var delayComplete = false
        if SpatialObject.get(info.resourceID) == nil {
            logger.warning("Missing resource:" + info.resourceID)
            return
        }
        let sr = SpatialObject.get(info.resourceID)!
        if let entity = sr as? SpatialEntity {
            if let setParentID: String = data.update?.setParent {
                if setParentID.isEmpty {
                    entity.setParent(parentEnt: nil)
                } else {
                    if let parentEntity = SpatialObject.get(setParentID) as? SpatialEntity {
                        entity.setParent(parentEnt: parentEntity)
                    } else {
                        logger.warning("Invalid setParentID: \(setParentID)")
                    }
                }
            }

            if let _ = data.update?.getBoundingBox {
                let b = entity.modelEntity.visualBounds(relativeTo: nil)
                let exts = "x:" + String(b.extents.x) + "," + "y:" + String(b.extents.y) + "," + "z:" + String(b.extents.z)
                let center = "x:" + String(b.center.x) + "," + "y:" + String(b.center.y) + "," + "z:" + String(b.center.z)
                target.completeEvent(requestID: info.requestID, data: "{center: {" + center + "}, extents: {" + exts + "}}")
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

            if var newParentID: String = data.update?.setParentWindowContainerID {
                newParentID = target.readWindowContainerID(id: newParentID)
                let wg = SpatialWindowContainer.getSpatialWindowContainer(newParentID)
                entity.setParentWindowContainer(wg: wg)
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
                spatialPhysicallyBasedMaterial.physicallyBasedMaterial.opacityThreshold = 0.0
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
                    logger.warning("invalid  meshResource")
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

            if let contentMode: String = data.update?.contentMode {
                if contentMode == "fill" {
                    spatialModel3DComponent.contentMode = .fill

                } else if contentMode == "fit" {
                    spatialModel3DComponent.contentMode = .fit
                }
            }

            if let resizable: Bool = data.update?.resizable {
                spatialModel3DComponent.resizable = resizable
            }

            if let aspectRatio: Double = data.update?.aspectRatio {
                if aspectRatio > 0 {
                    spatialModel3DComponent.aspectRatio = aspectRatio

                } else if aspectRatio == 0 {
                    spatialModel3DComponent.aspectRatio = nil
                }
            }

            if let enableTapEvent: Bool = data.update?.enableTapEvent {
                spatialModel3DComponent.enableTapEvent = enableTapEvent
            }

            if let enableDoubleTapEvent: Bool = data.update?.enableDoubleTapEvent {
                spatialModel3DComponent.enableDoubleTapEvent = enableDoubleTapEvent
            }

            if let enableDragEvent: Bool = data.update?.enableDragEvent {
                spatialModel3DComponent.enableDragEvent = enableDragEvent
            }

            if let enableLongPressEvent: Bool = data.update?.enableLongPressEvent {
                spatialModel3DComponent.enableLongPressEvent = enableLongPressEvent
            }

            if let scrollWithParent: Bool = data.update?.scrollWithParent {
                spatialModel3DComponent.scrollWithParent = scrollWithParent
            }

        } else if let spatialWindowComponent = sr as? SpatialWindowComponent {
            if let _: String = data.update?.getEntityID {
                if let entity: SpatialEntity = spatialWindowComponent.entity {
                    target.completeEvent(requestID: info.requestID, data: "{parentID:'" + entity.id + "'}")

                } else {
                    target.completeEvent(requestID: info.requestID, data: "{parentID:''}")
                }
                return
            }

            if let _: String = data.update?.getParentID {
                target.completeEvent(requestID: info.requestID, data: "{parentID:'" + spatialWindowComponent.parentWebviewID + "'}")
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
                    spatialWindowComponent.didFinishFirstLoad = true
                }
            }

            if let url: String = data.update?.url {
                // Compute target url depending if the url is relative or not
                let targetUrl = target.parseURL(url: url)

                delayComplete = true
                if spatialWindowComponent.loadRequestID == -1 {
                    spatialWindowComponent.loadRequestID = info.requestID
                    spatialWindowComponent.loadRequestWV = target
                    spatialWindowComponent.setURL(url: URL(string: targetUrl)!)
                    spatialWindowComponent.getView()!.initialLoad()
                } else {
                    target.failEvent(requestID: info.requestID)
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
                clock.backgroundSet()

                if spatialWindowComponent.isLoading {
                    spatialWindowComponent.loadingStyles.backgroundMaterial = backgroundMaterial
                }
                spatialWindowComponent.backgroundMaterial = backgroundMaterial
            }
            if let cornerRadius: CornerRadius = data.update?.style?.cornerRadius {
                if spatialWindowComponent.isLoading {
                    spatialWindowComponent.loadingStyles.cornerRadius = cornerRadius
                }
                spatialWindowComponent.cornerRadius = cornerRadius
            }
            spatialWindowComponent.gotStyle = true
        }
        if !delayComplete {
            target.completeEvent(requestID: info.requestID)
        }
    }

    private func createWindowContainer(target: SpatialWindowComponent, info: CommandInfo) {
        if let windowStyle: String = info.cmd.data!.windowStyle {
            let uuid = UUID().uuidString
            let wgd = WindowContainerData(windowStyle: windowStyle, windowContainerID: uuid)

            // Force window container creation to happen now so it can be accessed after complete event returns
            _ = SpatialWindowContainer.getOrCreateSpatialWindowContainer(uuid, wgd)

            if let wg = SpatialWindowContainer.getOrCreateSpatialWindowContainer(target.parentWindowContainerID, wgd) {
                wg.openWindowData.send(wgd)

                // If the parent window component  isn't set, the new container can continue to exist even after other window is closed
                if info.resourceID != "notFound" {
                    let rid = info.resourceID
                    let so = SpatialObject.get(rid)
                    if let parentWindowComponent = so as? SpatialWindowComponent {
                        parentWindowComponent.setWindowContainer(uuid: uuid, wgd: wgd)
                    }
                }

                if info.windowContainerID != "notFound" {
                    if let parentContainer = SpatialWindowContainer.getSpatialWindowContainer(info.windowContainerID) {
                        parentContainer.childContainers[uuid] = wg
                    }
                }

                target.completeEvent(requestID: info.requestID, data: "{createdID: '" + uuid + "'}")
            }
        }
    }

    private func createScene(target: SpatialWindowComponent, info: CommandInfo) {
        let data = info.cmd.data!
        if let _: String = data.windowStyle {
            // windowID exist in SWC

            // TODO: check url scope
            // in scope: the url is configured in manifest
            // if not in scope, open in safari

            if data.sceneData?.method == "createRoot" {
                if let windowID = data.sceneData?.windowID {
                    // if windowID in spawned uuid, createRoot

                    if target.spawnedNativeWebviews[windowID] != nil {
                        // setup windowContainer defaultValues
                        if let config = data.sceneData?.sceneConfig {
                            SceneManager.Instance
                                .createRoot(target: target, windowID: windowID, config: config)
                        } else {
                            SceneManager.Instance
                                .createRoot(target: target, windowID: windowID)
                        }

                    } else {
                        if let windowContainerID = data.sceneData?.windowContainerID {
                            SceneManager.Instance.focusRoot(target: target, windowContainerID: windowContainerID)
                        } else {
                            logger.error("error: no windowContainerID")
                        }
                    }

                    target.completeEvent(requestID: info.requestID, data: "{}")
                }
            } else if data.sceneData?.method == "showRoot" {
                if let config = data.sceneData?.sceneConfig {
                    let parentWindowContainerID = info.windowContainerID
                    SceneManager.Instance.showRoot(target: target, config: config, parentWindowContainerID: parentWindowContainerID)
                }
                target.completeEvent(requestID: info.requestID, data: "{}")

            } else {
                target.failEvent(requestID: info.requestID, data: "method not supported")
            }
        }
    }

    private func updateWindowContainer(target: SpatialWindowComponent, info: CommandInfo) {
        let data = info.cmd.data!
        if let _ = data.update?.getRootEntityID,
           let wg = SpatialWindowContainer.getSpatialWindowContainer(target.readWindowContainerID(id: info.windowContainerID))
        {
            let rootEntity = wg.getEntities().filter {
                $0.value.coordinateSpace == .ROOT
            }.first?.value
            if rootEntity != nil {
                target.completeEvent(requestID: info.requestID, data: "{rootEntId:'" + rootEntity!
                    .id + "'}")
            } else {
                target.completeEvent(requestID: info.requestID, data: "{rootEntId:''}")
            }
            return
        }

        if let resolution = data.update?.nextOpenSettings?.resolution {
            sceneStateChangedCB = { _ in
                // Complete event after scene state change is completed
                target.completeEvent(requestID: info.requestID)
                sceneStateChangedCB = { _ in }
            }

            // Update scene state
            var cfg = WindowContainerPlainDefaultValues()
            cfg.defaultSize = CGSize(width: resolution.width, height: resolution.height)
            // TODO: need set resizeRange?
            WindowContainerMgr.Instance.updateWindowContainerPlainDefaultValues(cfg)
            return
        }

        if let shouldClose = data.update?.close,
           let wg = SpatialWindowContainer.getSpatialWindowContainer(target.readWindowContainerID(id: info.windowContainerID))
        {
            if shouldClose {
                wg.destroy()
            }
        }

        target.completeEvent(requestID: info.requestID)
    }

    private func openImmersiveSpace(target: SpatialWindowComponent, info: CommandInfo) {
        let wg = SpatialWindowContainer.getSpatialWindowContainer(target.parentWindowContainerID)
        wg?.toggleImmersiveSpace.send(true)
    }

    private func dismissImmersiveSpace(target: SpatialWindowComponent, info: CommandInfo) {
        let wg = SpatialWindowContainer.getSpatialWindowContainer(target.parentWindowContainerID)
        wg?.toggleImmersiveSpace.send(false)
    }

    private func log(target: SpatialWindowComponent, info: CommandInfo) {
        if let logStringArr: [String] = info.cmd.data!.logString {
            let logString = logStringArr.joined()
            logger.debug(logString)
        }
    }

    private func setLoading(target: SpatialWindowComponent, info: CommandInfo) {
        let data = info.cmd.data!
        switch data.loading?.method {
        case "show":
            SceneManager.Instance.setLoading(.show, windowContainerID: info.windowContainerID)
        case "hide":
            SceneManager.Instance.setLoading(.hide, windowContainerID: info.windowContainerID)
        case _:
            break
        }
        target.completeEvent(requestID: info.requestID)
    }
}

struct RawJSBCommand: Codable {
    var command: String
    var data: RawJSData?
    var requestID: Int
}

struct JSBCommand {
    var command: String
    var data: JSData?
    var requestID: Int
}

protocol JSData {
    var commandList: [RawJSBCommand]? { get } // multiCommand
    var type: String? { get } // createResource
    var params: JSParams? { get } // createResource
    var update: JSResourceData? { get }
    var windowStyle: String? { get }
    var windowContainerOptions: WindowContainerOptions? { get }
    var sceneData: SceneJSBData? { get }
    var logString: [String]? { get }
    var logLevel: String? { get }
    var loading: LoadingJSBData? { get }
}

struct RawJSData: Codable, JSData {
    var commandList: [RawJSBCommand]? // multiCommand
    var resourceID: String?
    var windowContainerID: String?
    var entityID: String? // setComponent
    var type: String? // createResource
    var params: JSParams? // createResource
    var update: JSResourceData?
    var windowStyle: String?
    var windowContainerOptions: WindowContainerOptions?
    var sceneData: SceneJSBData?
    var logString: [String]?
    var logLevel: String?
    var loading: LoadingJSBData?
}

struct JSParams: Codable {
    var shape: String?
    var modelURL: String?
}

struct JSResourceData: Codable {
    var setParent: String?
    var setCoordinateSpace: String?
    var setParentWindowContainerID: String?
    var position: JSVector3F?
    var orientation: JSVector4?
    var scale: JSVector3F?
    var baseColor: JSColor?
    var roughness: JSValue?
    var metallic: JSValue?
    var url: String?
    var aspectRatio: Double?
    var opacity: Double?
    var contentMode: String?
    var resizable: Bool?
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
    var nextOpenSettings: JSNextOpen?
    var close: Bool?
    var getBoundingBox: Bool?
    var zIndex: Double?
    var visible: Bool?
    var name: String?

    var enableTapEvent: Bool?
    var enableDoubleTapEvent: Bool?
    var enableDragEvent: Bool?
    var enableLongPressEvent: Bool?
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

struct JSResolution: Codable {
    var width: Double
    var height: Double
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

struct JSNextOpen: Codable {
    var resolution: JSResolution?
}

struct SceneJSBData: Codable {
    var method: String?
    var sceneName: String?
    var sceneConfig: WindowContainerOptions?
    var url: String?
    var windowID: String?
    var windowContainerID: String?
}

struct LoadingJSBData: Codable {
    var method: String?
    var style: String?
}
