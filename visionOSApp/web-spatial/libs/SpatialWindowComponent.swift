
//
//  SpatialWindowComponent.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import RealityKit
import SwiftUI
import SwiftyBeaver

let DefaultPlainWindowGroupSize = CGSize(width: 1280, height: 720)

func getDocumentsDirectory() -> URL {
    let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
    let documentsDirectory = paths[0]
    return documentsDirectory
}

struct CommandInfo {
    var windowGroupID = "notFound"
    var entityID = "notFound"
    var resourceID = "notFound"
    var requestID = -1
}

struct LoadingStyles {
    var visible = true
    var glassEffect = false
    var transparentEffect = false
    var cornerRadius = CGFloat(0)
    var materialThickness = Material.ultraThin
    var useMaterialThickness = false
    var windowGroupSize = DefaultPlainWindowGroupSize
}

@Observable
class SpatialWindowComponent: SpatialComponent {
    override func inspect() -> [String: Any] {
        let childEntitiesInfo = childResources.mapValues { spatialObject in
            spatialObject.inspect()
        }

        var inspectInfo: [String: Any] = [
            "scrollWithParent": scrollWithParent,
            "resolutionX": resolutionX,
            "resolutionY": resolutionY,
            "parentWebviewID": parentWebviewID,
            "parentWindowGroupID": parentWindowGroupID,
            "childWindowGroups": childWindowGroups,
            "spawnedNativeWebviewsCount": spawnedNativeWebviews.count,
            "childResources": childEntitiesInfo,
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }

    var scrollOffset = CGPoint()
    private var webViewNative: WebViewNative?
    var resolutionX: Double = 0
    var resolutionY: Double = 0
    var scrollWithParent = false

    // ID of the webview that created this or empty if its root
    var parentWebviewID: String = ""
    var parentWindowGroupID: String
    var childWindowGroups = [String: WindowGroupData]()
    var spawnedNativeWebviews = [String: WebViewNative]()

    private var childResources = [String: SpatialObject]()
    private func addChildSpatialObject(_ spatialObject: SpatialObject) {
        childResources[spatialObject.id] = spatialObject
        spatialObject
            .on(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
    }

    private func removeChildSpatialObject(_ spatialObject: SpatialObject) {
        spatialObject
            .off(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
        childResources.removeValue(forKey: spatialObject.id)
    }

    private func onSptatialObjectDestroyed(_ object: Any, _ data: Any) {
        let spatialObject = object as! SpatialObject
        removeChildSpatialObject(spatialObject)
    }

    // Drag event handling
    var dragStarted = false
    var dragStart = 0.0
    var dragVelocity = 0.0

    var gotStyle = false
    var visible = true
    var glassEffect = false
    var transparentEffect = false
    var cornerRadius = CGFloat(0)
    var materialThickness = Material.ultraThin
    var useMaterialThickness = false

    var loadingStyles = LoadingStyles()
    var isLoading = true

    init(parentWindowGroupID: String) {
//        wgManager.wvActiveInstances += 1
        self.parentWindowGroupID = parentWindowGroupID
        super.init()
        webViewNative = WebViewNative()
        webViewNative?.webViewRef = self
        _ = webViewNative?.createResources()
    }

    init(parentWindowGroupID: String, url: URL) {
//        wgManager.wvActiveInstances += 1
        self.parentWindowGroupID = parentWindowGroupID
        super.init()

        webViewNative = WebViewNative(url: url)
        webViewNative?.webViewRef = self
        _ = webViewNative?.createResources()
    }

    func initFromURL(url: URL) {
        webViewNative = WebViewNative(url: url)
        webViewNative?.webViewRef = self
        _ = webViewNative?.createResources()
    }

    func navigateToURL(url: URL) {
        webViewNative!.url = url
        webViewNative!.webViewHolder.needsUpdate = true
        webViewNative!.initialLoad()
    }

    func isScrollEnabled() -> Bool {
        return webViewNative!.webViewHolder.appleWebView!.scrollView.isScrollEnabled
    }

    func updateScrollOffset(delta: CGFloat) {
        webViewNative!.webViewHolder.appleWebView!.scrollView.contentOffset.y += delta
    }

    func stopScrolling() {
        webViewNative!.webViewHolder.appleWebView!.scrollView.stopScrollingAndZooming()
    }

    func getView() -> WebViewNative? {
        return webViewNative
    }

    func evaluateJS(js: String) {
        webViewNative!.webViewHolder.appleWebView!.evaluateJavaScript(js)
    }

    func getURL() -> URL? {
        return webViewNative?.url
    }

    func stringToThickness(str: String) -> SwiftUI.Material? {
        if str == "thin" {
            return Material.thin
        }
        if str == "thick" {
            return Material.thick
        }
        if str == "regular" {
            return Material.regular
        }
        return nil
    }

    func parseURL(url: String) -> String {
        // Compute target url depending if the url is relative or not
        var targetUrl = url
        if url[...url.index(url.startIndex, offsetBy: 0)] == "/" {
            // Absolute path
            var port = ""
            if let p = webViewNative?.url.port {
                port = ":"+String(p)
            }
            let domain = webViewNative!.url.scheme!+"://"+webViewNative!.url.host()!+port+"/"
            targetUrl = domain+String(url[url.index(url.startIndex, offsetBy: 1)...])
        } else {
            // Reletive path
            let localDir = NSString(string: webViewNative!.url.absoluteString)
            let relPath = String(localDir.deletingLastPathComponent)+"/"+targetUrl
            return relPath
        }
        return targetUrl
    }

    func readWinodwGroupID(id: String) -> String {
        if id == "current" {
            return parentWindowGroupID
        } else {
            return id
        }
    }

    func getCommandInfo(json: JsonParser) -> CommandInfo? {
        if let rID: Int = json.getValue(lookup: ["requestID"]) {
            var ret = CommandInfo()
            ret.requestID = rID

            if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]) {
                ret.windowGroupID = readWinodwGroupID(id: windowGroupID)
            }

            if let entityID: String = json.getValue(lookup: ["data", "entityID"]) {
                ret.entityID = entityID
            }

            if let resourceID: String = json.getValue(lookup: ["data", "resourceID"]) {
                ret.resourceID = resourceID
            }

            if ret.resourceID == "current" {
                ret.resourceID = id
            }
            return ret
        }
        return nil
    }

    deinit {
//        wgManager.wvActiveInstances -= 1
        webViewNative!.destroy()
    }

    func completeEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: true, requestID:"+String(requestID)+", data: "+data+"})")
    }

    func fireGestureEvent(inputComponentID: String, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({inputComponentID:'"+inputComponentID+"', data: "+data+"})")
    }

    func failEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: false, requestID:"+String(requestID)+", data: "+data+"})")
    }

    // Request information of webview that request this webview to load
    weak var loadRequestWV: SpatialWindowComponent?
    var loadRequestID = -1
//    var resourceID = ""
    // A load request of a child webview was loaded
    func didLoadChild(loadRequestID: Int, resourceID: String) {
        completeEvent(requestID: loadRequestID, data: "{createdID: '"+id+"'}")
    }

    func didStartLoadPage() {
        let spatialObjects = childResources.map { $0.value }
        for spatialObject in spatialObjects {
            spatialObject.destroy()
        }
        childResources = [String: SpatialObject]()
        spawnedNativeWebviews = [String: WebViewNative]()

        let wgkeys = childWindowGroups.map { $0.key }
        for k in wgkeys {
            SpatialWindowGroup.getSpatialWindowGroup(k)!.closeWindowData.send(childWindowGroups[k]!)
        }
        let url = webViewNative?.webViewHolder.appleWebView?.url
        webViewNative!.url = url!

        // Mark that we havn't gotten a style update
        gotStyle = false
        isLoading = true
        loadingStyles = LoadingStyles()
    }

    func didSpawnWebView(wv: WebViewNative) {
        let uuid = UUID().uuidString
        wv.webViewHolder.appleWebView!.evaluateJavaScript("window._webSpatialID = '"+uuid+"'")
        spawnedNativeWebviews[uuid] = wv
    }

    func didStartReceivePageContent() {}

    func didFinishLoadPage() {
        glassEffect = loadingStyles.glassEffect
        transparentEffect = loadingStyles.transparentEffect
        cornerRadius = loadingStyles.cornerRadius
        materialThickness = loadingStyles.materialThickness
        useMaterialThickness = loadingStyles.useMaterialThickness

//        if root {
//            let wg = wgManager.getWindowGroup(windowGroup: parentWindowGroupID)
//            wg.setSize.send(loadingStyles.windowGroupSize)
//        }
        if !gotStyle {
            // We didn't get a style update in time (might result in FOUC)
            // Set default style
            //   print("Didn't get SwiftUI styles prior to page finish load")
        }
        isLoading = false
    }

    func onJSScriptMessage(json: JsonParser) {
        if let command: String = json.getValue(lookup: ["command"]) {
            if command == "multiCommand" {
                if let cmdInfo = getCommandInfo(json: json) {
                    if let commandList = ((json.json as AnyObject)["data"] as AnyObject)["commandList"] as? [AnyObject] {
                        for subCommand in commandList {
                            if let obj = subCommand as? [String: AnyObject] {
                                let jp = JsonParser(str: nil)
                                jp.json = obj
                                onJSScriptMessage(json: jp)
                            }
                        }
                    }
                    completeEvent(requestID: cmdInfo.requestID, data: "{}")
                }
            } else if command == "ping" {
                if let cmdInfo = getCommandInfo(json: json) {
                    completeEvent(requestID: cmdInfo.requestID, data: "{ping: 'Complete'}")
                }
            } else if command == "inspect" {
                if let cmdInfo = getCommandInfo(json: json) {
                    if let spatialObject = SpatialObject.getRefObject(cmdInfo.resourceID) {
                        let inspectInfo = spatialObject.inspect()
                        let isValidJSON = JSONSerialization.isValidJSONObject(inspectInfo)
                        if isValidJSON {
                            do {
                                let jsonData = try JSONSerialization.data(withJSONObject: inspectInfo, options: [])
                                let jsonString = String(data: jsonData, encoding: .utf8)
                                completeEvent(requestID: cmdInfo.requestID, data: jsonString ?? "Conver failed")
                            } catch {
                                print("Error: \(error.localizedDescription)")
                                completeEvent(requestID: cmdInfo.requestID, data: """
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
            } else if command == "getStats" {
                if let cmdInfo = getCommandInfo(json: json) {
                    let statsInfo = SpatialObject.stats()
                    do {
                        let jsonData = try JSONEncoder().encode(statsInfo)
                        let jsonString = String(data: jsonData, encoding: .utf8)
                        completeEvent(requestID: cmdInfo.requestID, data: jsonString ?? "Conver failed")
                    } catch {
                        print("Error: \(error.localizedDescription)")
                        completeEvent(requestID: cmdInfo.requestID, data: """
                        error: \(error.localizedDescription)
                        """)
                    }
                }
            } else if command == "setComponent" {
                if let cmdInfo = getCommandInfo(json: json) {
                    if let component = childResources[cmdInfo.resourceID] as? SpatialComponent,
                       let entity = childResources[cmdInfo.entityID] as? SpatialEntity
                    {
                        entity.addComponent(component)
                    } else {
                        print("missing resource, event not processed")
                    }
                }
            } else if command == "createResource" {
                if let cmdInfo = getCommandInfo(json: json),
                   let type: String = json.getValue(lookup: ["data", "type"])
                {
                    var sr: SpatialObject?
                    if type == "Entity" {
                        sr = SpatialEntity()
                    } else if type == "InputComponent" {
                        sr = SpatialInputComponent()
                        (sr as! SpatialInputComponent).wv = self
                    } else if type == "MeshResource" {
                        if let shape: String = json.getValue(lookup: ["data", "params", "shape"]) {
                            let meshResource: MeshResource = shape == "sphere" ? .generateSphere(radius: 0.5) : .generateBox(size: 1.0)
                            sr = SpatialMeshResource(meshResource)
                        }
                    } else if type == "PhysicallyBasedMaterial" {
                        sr = SpatialPhysicallyBasedMaterial(PhysicallyBasedMaterial())
                    } else if type == "SpatialWebView" {
                        sr = SpatialWindowComponent(parentWindowGroupID: cmdInfo.windowGroupID)
                        let spatialWindowComponent = sr as! SpatialWindowComponent
                        spatialWindowComponent.parentWebviewID = id
                    } else if type == "ModelUIComponent" {
                        sr = SpatialModelUIComponent()
                    } else if type == "ModelComponent" {
                        if var modelURL: String = json.getValue(lookup: ["data", "params", "modelURL"]) {
                            modelURL = parseURL(url: modelURL)
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
                                            self.completeEvent(requestID: cmdInfo.requestID, data: "{createdID: '"+spatialModelComponent.id+"'}")
                                            self.addChildSpatialObject(spatialModelComponent)

                                            print("Model load success!")
                                        }
                                    } catch {
                                        print("failed to load model: "+error.localizedDescription)
                                    }
                                }

                            })
                            downloadTask.resume()
                            return
                        } else {
                            let modelComponent = ModelComponent(mesh: .generateBox(size: 0.0), materials: [])
                            sr = SpatialModelComponent(modelComponent)
                        }
                    }

                    if let srObject = sr {
                        completeEvent(requestID: cmdInfo.requestID, data: "{createdID: '"+srObject.id+"'}")
                        addChildSpatialObject(srObject)
                    } else {
                        print("failed to create sr of type", type)
                    }
                }
            } else if command == "destroyResource" {
                if let cmdInfo = getCommandInfo(json: json) {
                    childResources[cmdInfo.resourceID]?.destroy()
                }
            } else if command == "updateResource" {
                if let cmdInfo = getCommandInfo(json: json) {
                    var delayComplete = false
                    if SpatialObject.get(cmdInfo.resourceID) == nil {
                        print("Missing resource")
                        return
                    }
                    let sr = SpatialObject.get(cmdInfo.resourceID)!
                    if let entity = sr as? SpatialEntity {
                        if let setParentID: String = json.getValue(lookup: ["data", "update", "setParent"]) {
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

                        if let space: String = json.getValue(lookup: ["data", "update", "setCoordinateSpace"]) {
                            entity.coordinateSpace = .APP
                            if space == "Root" {
                                entity.coordinateSpace = .ROOT
                            }

                            if space == "Dom" {
                                entity.coordinateSpace = .DOM
                            }
                        }

                        if var newParentID: String = json.getValue(lookup: ["data", "update", "setParentWindowGroupID"]) {
                            newParentID = readWinodwGroupID(id: newParentID)
                            let wg = SpatialWindowGroup.getSpatialWindowGroup(newParentID)
                            entity.setParentWindowGroup(wg: wg)
                        }

                        if let x: Double = json.getValue(lookup: ["data", "update", "position", "x"]),
                           let y: Double = json.getValue(lookup: ["data", "update", "position", "y"]),
                           let z: Double = json.getValue(lookup: ["data", "update", "position", "z"]),
                           let scalex: Double = json.getValue(lookup: ["data", "update", "scale", "x"]),
                           let scaley: Double = json.getValue(lookup: ["data", "update", "scale", "y"]),
                           let scalez: Double = json.getValue(lookup: ["data", "update", "scale", "z"]),
                           let orientationx: Double = json.getValue(lookup: ["data", "update", "orientation", "x"]),
                           let orientationy: Double = json.getValue(lookup: ["data", "update", "orientation", "y"]),
                           let orientationz: Double = json.getValue(lookup: ["data", "update", "orientation", "z"]),
                           let orientationw: Double = json.getValue(lookup: ["data", "update", "orientation", "w"])
                        {
                            entity.modelEntity.position.x = Float(x)
                            entity.modelEntity.position.y = Float(y)
                            entity.modelEntity.position.z = Float(z)
                            entity.modelEntity.scale.x = Float(scalex)
                            entity.modelEntity.scale.y = Float(scaley)
                            entity.modelEntity.scale.z = Float(scalez)
                            entity.modelEntity.orientation.vector.x = Float(orientationx)
                            entity.modelEntity.orientation.vector.y = Float(orientationy)
                            entity.modelEntity.orientation.vector.z = Float(orientationz)
                            entity.modelEntity.orientation.vector.w = Float(orientationw)
                            entity.forceUpdate = !entity.forceUpdate
                        }
                    } else if sr is SpatialMeshResource {
                    } else if let spatialPhysicallyBasedMaterial = sr as? SpatialPhysicallyBasedMaterial {
                        if let r: Double = json.getValue(lookup: ["data", "update", "baseColor", "r"]),
                           let g: Double = json.getValue(lookup: ["data", "update", "baseColor", "g"]),
                           let b: Double = json.getValue(lookup: ["data", "update", "baseColor", "b"]),
                           let a: Double = json.getValue(lookup: ["data", "update", "baseColor", "a"])
                        {
                            spatialPhysicallyBasedMaterial.physicallyBasedMaterial.baseColor = PhysicallyBasedMaterial.BaseColor(tint: UIColor(red: r, green: g, blue: b, alpha: a))
                        }

                        if let roughness: Double = json.getValue(lookup: ["data", "update", "roughness", "value"]) {
                            spatialPhysicallyBasedMaterial.physicallyBasedMaterial.roughness = PhysicallyBasedMaterial.Roughness(floatLiteral: Float(roughness))
                        }

                        if let metallic: Double = json.getValue(lookup: ["data", "update", "metallic", "value"]) {
                            spatialPhysicallyBasedMaterial.physicallyBasedMaterial.metallic = PhysicallyBasedMaterial.Metallic(floatLiteral: Float(metallic))
                        }

                    } else if let spatialModelUIComponent = sr as? SpatialModelUIComponent {
                        if var url: String = json.getValue(lookup: ["data", "update", "url"]) {
                            url = parseURL(url: url)
                            spatialModelUIComponent.url = URL(string: url)!
                        }
                        if let aspectRatio: String = json.getValue(lookup: ["data", "update", "aspectRatio"]) {
                            spatialModelUIComponent.aspectRatio = aspectRatio
                        }
                        if let opacity: Double = json.getValue(
                            lookup: ["data", "update", "opacity"]
                        ) {
                            spatialModelUIComponent.opacity = opacity
                        }
                        if let x: Double = json.getValue(lookup: ["data", "update", "resolution", "x"]),
                           let y: Double = json.getValue(lookup: ["data", "update", "resolution", "y"])
                        {
                            spatialModelUIComponent.resolutionX = x
                            spatialModelUIComponent.resolutionY = y
                        }

                    } else if let spatialModelComponent = sr as? SpatialModelComponent {
                        if let meshResourceId: String = json.getValue(lookup: ["data", "update", "meshResource"]) {
                            if let spatialMeshResource = childResources[meshResourceId] as? SpatialMeshResource {
                                spatialModelComponent.modelComponent.mesh = spatialMeshResource.meshResource
                            } else {
                                print("invalid  meshResource")
                            }
                        }

                        if let materials: [String] = json.getValue(lookup: ["data", "update", "materials"]) {
                            spatialModelComponent.modelComponent.materials = []
                            for matID in materials {
                                if let spatialMaterialComponent = childResources[matID] as? SpatialPhysicallyBasedMaterial {
                                    spatialModelComponent.modelComponent.materials.append(spatialMaterialComponent.physicallyBasedMaterial)
                                }
                            }
                        }
                    } else if let spatialWindowComponent = sr as? SpatialWindowComponent {
                        if let _: String = json.getValue(lookup: ["data", "update", "getEntityID"]) {
                            let id = spatialWindowComponent.entity!.id
                            completeEvent(requestID: cmdInfo.requestID, data: "{parentID:'"+id+"'}")
                            return
                        }

                        if let _: String = json.getValue(lookup: ["data", "update", "getParentID"]) {
                            completeEvent(requestID: cmdInfo.requestID, data: "{parentID:'"+spatialWindowComponent.parentWebviewID+"'}")
                            return
                        }

                        if let scrollEnabled: Bool = json.getValue(lookup: ["data", "update", "scrollEnabled"]) {
                            if !scrollEnabled {
                                spatialWindowComponent.webViewNative!.webViewHolder.appleWebView!.scrollView.contentOffset.y = 0
                                spatialWindowComponent.webViewNative!.webViewHolder.appleWebView!.scrollView.isScrollEnabled = false
                            } else {
                                spatialWindowComponent.webViewNative!.webViewHolder.appleWebView!.scrollView.isScrollEnabled = true
                            }
                        }

                        if let top: Double = json.getValue(lookup: ["data", "update", "setScrollEdgeInsets", "top"]),
                           let left: Double = json.getValue(lookup: ["data", "update", "setScrollEdgeInsets", "left"]),
                           let bottom: Double = json.getValue(lookup: ["data", "update", "setScrollEdgeInsets", "bottom"]),
                           let right: Double = json.getValue(lookup: ["data", "update", "setScrollEdgeInsets", "right"])
                        {
                            spatialWindowComponent.webViewNative!.webViewHolder.appleWebView!.scrollView.contentInset = UIEdgeInsets(top: top, left: left, bottom: bottom, right: right)
                        }

                        if let scrollWithParent: Bool = json.getValue(lookup: ["data", "update", "scrollWithParent"]) {
                            spatialWindowComponent.scrollWithParent = scrollWithParent
                        }

                        if let windowID: String = json.getValue(lookup: ["data", "update", "windowID"]) {
                            if let spawnedWebView = spawnedNativeWebviews.removeValue(forKey: windowID) {
                                spatialWindowComponent.webViewNative!.destroy()
                                spatialWindowComponent.webViewNative = spawnedWebView
                                spatialWindowComponent.webViewNative!.webViewRef = spatialWindowComponent
                                spatialWindowComponent.webViewNative!.webViewHolder.webViewCoordinator!.webViewRef = spatialWindowComponent
                            }
                        }

                        if let url: String = json.getValue(lookup: ["data", "update", "url"]) {
                            // Compute target url depending if the url is relative or not
                            let targetUrl = parseURL(url: url)

                            delayComplete = true
                            if spatialWindowComponent.loadRequestID == -1 {
                                spatialWindowComponent.loadRequestID = cmdInfo.requestID
                                spatialWindowComponent.loadRequestWV = self
                                spatialWindowComponent.webViewNative!.url = URL(string: targetUrl)!
                                spatialWindowComponent.webViewNative!.initialLoad()
                            } else {
                                failEvent(requestID: cmdInfo.requestID)
                            }
                        }

                        if let x: Double = json.getValue(lookup: ["data", "update", "resolution", "x"]),
                           let y: Double = json.getValue(lookup: ["data", "update", "resolution", "y"])
                        {
                            spatialWindowComponent.resolutionX = x
                            spatialWindowComponent.resolutionY = y
                        }

                        if let materialThickness: String = json.getValue(lookup: ["data", "update", "style", "materialThickness"]) {
                            let mat = stringToThickness(str: materialThickness)
                            if mat != nil {
                                if isLoading {
                                    loadingStyles.useMaterialThickness = true
                                    loadingStyles.materialThickness = mat!
                                }
                                spatialWindowComponent.useMaterialThickness = true
                                spatialWindowComponent.materialThickness = mat!
                            } else {
                                if isLoading {
                                    loadingStyles.useMaterialThickness = false
                                }
                                spatialWindowComponent.useMaterialThickness = false
                            }
                        }

                        if let glassEffect: Bool = json.getValue(lookup: ["data", "update", "style", "glassEffect"]) {
                            if isLoading {
                                loadingStyles.glassEffect = glassEffect
                            }
                            spatialWindowComponent.glassEffect = glassEffect
                        }
                        if let transparentEffect: Bool = json.getValue(lookup: ["data", "update", "style", "transparentEffect"]) {
                            if isLoading {
                                loadingStyles.transparentEffect = transparentEffect
                            }
                            spatialWindowComponent.transparentEffect = transparentEffect
                        }
                        if let cornerRadius: Double = json.getValue(lookup: ["data", "update", "style", "cornerRadius"]) {
                            if isLoading {
                                loadingStyles.cornerRadius = CGFloat(cornerRadius)
                            }
                            spatialWindowComponent.cornerRadius = CGFloat(cornerRadius)
                        }
                        spatialWindowComponent.gotStyle = true
                    }
                    if !delayComplete {
                        completeEvent(requestID: cmdInfo.requestID)
                    }
                }

            } else if command == "createWindowGroup" {
                if let cmdInfo = getCommandInfo(json: json),
                   let windowStyle: String = json.getValue(lookup: ["data", "windowStyle"])
                {
                    let uuid = UUID().uuidString
                    let wgd = WindowGroupData(windowStyle: windowStyle, windowGroupID: uuid)

                    // Force window group creation to happen now so it can be accessed after complete event returns
                    let _ = SpatialWindowGroup.getOrCreateSpatialWindowGroup(uuid)

                    SpatialWindowGroup.getRootWindowGroup().openWindowData.send(wgd)
                    childWindowGroups[uuid] = wgd
                    completeEvent(requestID: cmdInfo.requestID, data: "{createdID: '"+uuid+"'}")
                }
            } else if command == "updateWindowGroup" {
                if let cmdInfo = getCommandInfo(json: json) {
                    if let x: Double = json.getValue(lookup: ["data", "update", "style", "dimensions", "x"]),
                       let y: Double = json.getValue(lookup: ["data", "update", "style", "dimensions", "y"]),
                       let wg = SpatialWindowGroup.getSpatialWindowGroup(cmdInfo.windowGroupID)
                    {
                        loadingStyles.windowGroupSize = CGSize(width: x, height: y)
                        wg.setSize.send(loadingStyles.windowGroupSize)
                    }

                    completeEvent(requestID: cmdInfo.requestID)
                }
            } else if command == "openImmersiveSpace" {
                SpatialWindowGroup.getRootWindowGroup().toggleImmersiveSpace.send(true)
            } else if command == "dismissImmersiveSpace" {
                SpatialWindowGroup.getRootWindowGroup().toggleImmersiveSpace.send(false)
            } else if command == "log" {
                if let logStringArr: [String] = json.getValue(lookup: ["data", "logString"]), let logLevel: String = json.getValue(lookup: ["data", "logLevel"]) {
                    let log = Logger.getLogger()
                    let logString = logStringArr.joined()
                    switch logLevel {
                    case "TRACE":
                        log.verbose(logString)

                    case "DEBUG":
                        log.debug(logString)

                    case "INFO":
                        log.info(logString)

                    case "WARN":
                        log.warning(logString)

                    case "ERROR":
                        log.error(logString)

                    default:
                        print(logString)
                    }
                }
            } else if command == "setLogLevel" {
                if let logLevel: String = json.getValue(lookup: ["data", "logLevel"]) {
                    let levelDict = [
                        "DEBUG": SwiftyBeaver.Level.debug,
                        "ERROR": SwiftyBeaver.Level.error,
                        "TRACE": SwiftyBeaver.Level.verbose,
                        "WARN": SwiftyBeaver.Level.warning,
                        "INFO": SwiftyBeaver.Level.info,
                    ]
                    if let level = levelDict[logLevel] {
                        for destination in SwiftyBeaver.destinations {
                            destination.minLevel = level
                        }
                    }
                }
            }
        }
    }
}
