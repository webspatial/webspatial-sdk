//
//  WebView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import RealityKit
import SwiftUI

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

class SpatialWebView: WatchableObject {
    var scrollOffset = CGPoint()
    var webViewNative: WebViewNative?

    var full = false
    var root = false
    @Published var resolutionX: Double = 0
    @Published var resolutionY: Double = 0
    var inline = true

    var parentWindowGroupID: String
    var childEntities = [String]()
    var childResources = [String]()

    var gotStyle = false
    @Published var visible = false
    @Published var glassEffect = true
    @Published var cornerRadius = CGFloat(0)

    init(parentWindowGroupID: String) {
        self.parentWindowGroupID = parentWindowGroupID
    }

    init(parentWindowGroupID: String, url: URL) {
        self.parentWindowGroupID = parentWindowGroupID
        webViewNative = WebViewNative(url: url)
        super.init()
        webViewNative?.webViewRef = self
    }

    func initFromURL(url: URL) {
        webViewNative = WebViewNative(url: url)
        webViewNative?.webViewRef = self
    }

    func getCommandInfo(json: JsonParser) -> CommandInfo? {
        if let rID: Int = json.getValue(lookup: ["requestID"]) {
            var ret = CommandInfo()
            ret.requestID = rID

            if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]) {
                ret.windowGroupID = windowGroupID
            }

            if let entityID: String = json.getValue(lookup: ["data", "entityID"]) {
                ret.entityID = entityID
            }

            if let resourceID: String = json.getValue(lookup: ["data", "resourceID"]) {
                ret.resourceID = resourceID
            }

            if ret.resourceID == "current" {
                ret.resourceID = resourceID
            }

            if ret.windowGroupID == "current" {
                ret.windowGroupID = parentWindowGroupID
            }
            return ret
        }
        return nil
    }

    deinit {
        // Remove references to Coordinator so that it gets cleaned up by arc
        webViewNative!.webViewHolder.appleWebView?.configuration.userContentController.removeScriptMessageHandler(forName: "bridge")
        webViewNative!.webViewHolder.appleWebView?.uiDelegate = nil
        webViewNative!.webViewHolder.appleWebView?.navigationDelegate = nil
        webViewNative!.webViewHolder.appleWebView?.scrollView.delegate = nil
    }

    func completeEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: true, requestID:"+String(requestID)+", data: "+data+"})")
    }

    func failEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: false, requestID:"+String(requestID)+", data: "+data+"})")
    }

    // Request information of webview that request this webview to load
    weak var loadRequestWV: SpatialWebView?
    var loadRequestID = -1
    var resourceID = ""
    // A load request of a child webview was loaded
    func didLoadChild(loadRequestID: Int, resourceID: String) {
        completeEvent(requestID: loadRequestID, data: "{createdID: '"+resourceID+"'}")
    }

    func didStartLoadPage() {
        gotStyle = false

        // TODO: remove entities/resources from their window group instead of this pages
        if childResources.count > 0 {
            for resource in childResources {
                let wg = wgManager.getWindowGroup(windowGroup: parentWindowGroupID)
                _ = wg.resources[resource]?.destroy()
            }
            childResources = [String]()
        }

        if childEntities.count > 0 {
            for ent in childEntities {
                let wg = wgManager.getWindowGroup(windowGroup: parentWindowGroupID)
                if wg.entities[ent]?.modelEntity.scene != nil {
                    _ = wg.entities[ent]!.destroy()
                }
            }
            childEntities = [String]()
        }
    }

    func didStartReceivePageContent() {
        glassEffect = true
    }

    func didFinishLoadPage() {
        Timer.scheduledTimer(withTimeInterval: 0.02, repeats: false) { _ in
            if !self.gotStyle {
                self.visible = true
                // Set default styles if cient hasn't set them by now
                self.glassEffect = false
                self.cornerRadius = CGFloat(0)
            }
        }
    }

    func onJSScriptMessage(json: JsonParser) {
        if let command: String = json.getValue(lookup: ["command"]) {
            if command == "ping" {
                if let cmdInfo = getCommandInfo(json: json) {
                    completeEvent(requestID: cmdInfo.requestID, data: "{ping: 'Complete'}")
                }
            } else if command == "setComponent" {
                if let cmdInfo = getCommandInfo(json: json) {
                    let wg = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                    let c = wg.resources[cmdInfo.resourceID]!
                    let e = wg.entities[cmdInfo.entityID]!

                    if c.resourceType == "ModelUIComponent" {
                        e.modelUIComponent = c.modelUIComponent
                    } else if c.resourceType == "ModelComponent" {
                        e.modelEntity.model = c.modelComponent
                    } else if c.resourceType == "SpatialWebView" {
                        e.spatialWebView = c.spatialWebView
                    }
                }
            } else if command == "createResource" {
                if let cmdInfo = getCommandInfo(json: json),
                   let type: String = json.getValue(lookup: ["data", "type"])
                {
                    let sr = SpatialResource(resourceType: type, mngr: wgManager, windowGroupID: cmdInfo.windowGroupID)
                    if type == "Entity" {
                        sr.modelEntity.model = ModelComponent(mesh: .generateBox(size: 0.0), materials: [])
                    } else if type == "MeshResource" {
                        if let shape: String = json.getValue(lookup: ["data", "params", "shape"]) {
                            if shape == "sphere" {
                                sr.meshResource = .generateSphere(radius: 0.5)
                            } else {
                                sr.meshResource = .generateBox(size: 1.0)
                            }
                        }
                    } else if type == "PhysicallyBasedMaterial" {
                        sr.physicallyBasedMaterial = PhysicallyBasedMaterial()
                    } else if type == "SpatialWebView" {
                        sr.spatialWebView = SpatialWebView(parentWindowGroupID: parentWindowGroupID)
                        sr.spatialWebView?.resourceID = sr.id
                    } else if type == "ModelUIComponent" {
                        sr.modelUIComponent = ModelUIComponent()
                    } else if type == "ModelComponent" {
                        if let modelURL: String = json.getValue(lookup: ["data", "params", "modelURL"]) {
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
                                        sr.modelComponent = await m.model!
                                        Task.detached { @MainActor in
                                            // Update state on main thread
                                            self.completeEvent(requestID: cmdInfo.requestID, data: "{createdID: '"+sr.id+"'}")
                                            self.childResources.append(sr.id)
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
                            sr.modelComponent = ModelComponent(mesh: .generateBox(size: 0.0), materials: [])
                        }
                    }
                    completeEvent(requestID: cmdInfo.requestID, data: "{createdID: '"+sr.id+"'}")
                    childResources.append(sr.id)
                }
            } else if command == "destroyResource" {
                if let cmdInfo = getCommandInfo(json: json) {
                    _ = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID).resources[cmdInfo.resourceID]?.destroy()
                }
            } else if command == "updateResource" {
                if let cmdInfo = getCommandInfo(json: json) {
                    var delayComplete = false
                    let wg = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                    if wg.resources[cmdInfo.resourceID] == nil {
                        print("Missing resource")
                        return
                    }
                    let sr = wg.resources[cmdInfo.resourceID]!
                    if sr.resourceType == "Entity" {
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
                            let wg = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                            if let e = wg.resources[cmdInfo.resourceID] {
                                e.modelEntity.position.x = Float(x)
                                e.modelEntity.position.y = Float(y)
                                e.modelEntity.position.z = Float(z)
                                e.modelEntity.scale.x = Float(scalex)
                                e.modelEntity.scale.y = Float(scaley)
                                e.modelEntity.scale.z = Float(scalez)
                                e.modelEntity.orientation.vector.x = Float(orientationx)
                                e.modelEntity.orientation.vector.y = Float(orientationy)
                                e.modelEntity.orientation.vector.z = Float(orientationz)
                                e.modelEntity.orientation.vector.w = Float(orientationw)
                                e.forceUpdate = !e.forceUpdate
                            }
                        }
                    } else if sr.resourceType == "MeshResource" {
                    } else if sr.resourceType == "PhysicallyBasedMaterial" {
                        if let r: Double = json.getValue(lookup: ["data", "update", "baseColor", "r"]),
                           let g: Double = json.getValue(lookup: ["data", "update", "baseColor", "g"]),
                           let b: Double = json.getValue(lookup: ["data", "update", "baseColor", "b"]),
                           let a: Double = json.getValue(lookup: ["data", "update", "baseColor", "a"])
                        {
                            sr.physicallyBasedMaterial!.baseColor = PhysicallyBasedMaterial.BaseColor(tint: UIColor(red: r, green: g, blue: b, alpha: a))
                        }

                        if let roughness: Double = json.getValue(lookup: ["data", "update", "roughness", "value"]) {
                            sr.physicallyBasedMaterial!.roughness = PhysicallyBasedMaterial.Roughness(floatLiteral: Float(roughness))
                        }

                        if let metallic: Double = json.getValue(lookup: ["data", "update", "metallic", "value"]) {
                            sr.physicallyBasedMaterial!.metallic = PhysicallyBasedMaterial.Metallic(floatLiteral: Float(metallic))
                        }

                    } else if sr.resourceType == "ModelUIComponent" {
                        if let url: String = json.getValue(lookup: ["data", "update", "url"]) {
                            sr.modelUIComponent?.url = URL(string: url)!
                        }
                        if let aspectRatio: String = json.getValue(lookup: ["data", "update", "aspectRatio"]) {
                            sr.modelUIComponent?.aspectRatio = aspectRatio
                        }
                        if let x: Double = json.getValue(lookup: ["data", "update", "resolution", "x"]),
                           let y: Double = json.getValue(lookup: ["data", "update", "resolution", "y"])
                        {
                            sr.modelUIComponent?.resolutionX = x
                            sr.modelUIComponent?.resolutionY = y
                        }

                    } else if sr.resourceType == "ModelComponent" {
                        if let meshResource: String = json.getValue(lookup: ["data", "update", "meshResource"]) {
                            sr.modelComponent!.mesh = wg.resources[meshResource]!.meshResource!
                        }

                        if let materials: [String] = json.getValue(lookup: ["data", "update", "materials"]) {
                            sr.modelComponent!.materials = []
                            for matID in materials {
                                sr.modelComponent!.materials.append(wg.resources[matID]!.physicallyBasedMaterial!)
                            }
                        }
                    } else if sr.resourceType == "SpatialWebView" {
                        if let url: String = json.getValue(lookup: ["data", "update", "url"]) {
                            // Compute target url depending if the url is relative or not
                            var targetUrl = url
                            if url[...url.index(url.startIndex, offsetBy: 0)] == "/" {
                                var port = ""
                                if let p = webViewNative?.url.port {
                                    port = ":"+String(p)
                                }
                                let domain = webViewNative!.url.scheme!+"://"+webViewNative!.url.host()!+port+"/"
                                targetUrl = domain+String(url[url.index(url.startIndex, offsetBy: 1)...])
                            }
                            // Create the webview
                            if sr.spatialWebView?.webViewNative == nil {
                                sr.spatialWebView!.initFromURL(url: URL(string: targetUrl)!)
                                _ = sr.spatialWebView!.webViewNative?.createResources()
                                sr.spatialWebView!.webViewNative?.initialLoad()
                            }

                            delayComplete = true
                            if sr.spatialWebView!.loadRequestID == -1 {
                                sr.spatialWebView!.loadRequestID = cmdInfo.requestID
                                sr.spatialWebView!.loadRequestWV = self
                                sr.spatialWebView!.webViewNative!.webViewHolder.appleWebView!.load(URLRequest(url: URL(string: targetUrl)!))
                            } else {
                                failEvent(requestID: cmdInfo.requestID)
                            }
                        }

                        if let x: Double = json.getValue(lookup: ["data", "update", "resolution", "x"]),
                           let y: Double = json.getValue(lookup: ["data", "update", "resolution", "y"])
                        {
                            sr.spatialWebView?.resolutionX = x
                            sr.spatialWebView?.resolutionY = y
                        }

                        if let glassEffect: Bool = json.getValue(lookup: ["data", "update", "style", "glassEffect"]),
                           let cornerRadius: Double = json.getValue(lookup: ["data", "update", "style", "cornerRadius"])
                        {
                            sr.spatialWebView?.glassEffect = glassEffect
                            sr.spatialWebView!.cornerRadius = CGFloat(cornerRadius)
                            sr.spatialWebView?.visible = true
                            gotStyle = true
                        }
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

                    wgManager.getWindowGroup(windowGroup: "root").openWindowData = wgd
                    completeEvent(requestID: cmdInfo.requestID, data: "{createdID: '"+uuid+"'}")
                }
            } else if command == "openImmersiveSpace" {
                wgManager.getWindowGroup(windowGroup: "root").toggleImmersiveSpace = true
            } else if command == "dismissImmersiveSpace" {
                wgManager.getWindowGroup(windowGroup: "root").toggleImmersiveSpace = false
            } else if command == "log" {
                if let logString: String = json.getValue(lookup: ["data", "logString"]) {
                    print(logString)
                }
            }
        }
    }
}
