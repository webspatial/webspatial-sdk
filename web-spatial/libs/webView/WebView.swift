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
    var webPanelID = "notFound"
    var entityID = "notFound"
    var requestID = -1
}

class SpatialWebView: ObservableObject {
    var scrollOffset = CGPoint()
    var pose = SIMD3<Float>(0, 0, 0)
    var webViewNative: WebViewNative?

    var full = true
    var width: Double = 0
    var height: Double = 0

    var parentWindowGroupId: String = ""
    var childPages = [String]()
    var childEntities = [String]()

    var gotStyle = false
    @Published var visible = false
    @Published var glassEffect = true
    @Published var cornerRadius = CGFloat(0)

    init() {}

    init(url: URL) {
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

            if let webPanelID: String = json.getValue(lookup: ["data", "webPanelID"]) {
                ret.webPanelID = webPanelID
            }

            if let entityID: String = json.getValue(lookup: ["data", "entityID"]) {
                ret.entityID = entityID
            }

            if ret.webPanelID == "current" {
                ret.webPanelID = webViewID
                ret.windowGroupID = parentWindowGroupId
            }

            if ret.windowGroupID == "current" {
                ret.windowGroupID = parentWindowGroupId
            }
            return ret
        }
        return nil
    }

    deinit {
        // Remove references to Coordinator so that it gets cleaned up by arc
        webViewNative!.webViewHolder.appleWebView?.configuration.userContentController.removeScriptMessageHandler(forName: "bridge")
        webViewNative!.webViewHolder.appleWebView!.uiDelegate = nil
        webViewNative!.webViewHolder.appleWebView!.navigationDelegate = nil
        webViewNative!.webViewHolder.appleWebView!.scrollView.delegate = nil
    }

    func completeEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({requestID:"+String(requestID)+", data: "+data+"})")
    }

    // Request information of webview that request this webview to load
    weak var loadRequestWV: SpatialWebView?
    var loadRequestID = -1
    var webViewID = ""
    // A load request of a child webview was loaded
    func didLoadChild(loadRequestID: Int, webViewID: String) {
        completeEvent(requestID: loadRequestID, data: "{createdID: '"+webViewID+"'}")
    }

    func didStartLoadPage() {
        gotStyle = false
        //  Remove existing child pages
        if childPages.count > 0 {
            for page in childPages {
                _ = wgManager.destroyWebView(windowGroup: parentWindowGroupId, windowID: page)
            }
            childPages = [String]()
        }

        if childEntities.count > 0 {
            for ent in childEntities {
                let wg = wgManager.getWindowGroup(windowGroup: parentWindowGroupId)
                if wg.entities[ent]!.modelEntity.scene != nil {
                    wg.entities[ent]!.modelEntity.removeFromParent()
                    wg.entities.removeValue(forKey: ent)
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
            }
        }
    }

    func onJSScriptMessage(json: JsonParser) {
        if let command: String = json.getValue(lookup: ["command"]) {
            if command == "createEntity" {
                if let cmdInfo = getCommandInfo(json: json) {
                    let uuid = UUID().uuidString

                    let wg = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                    let se = SpatialEntity()
                    se.modelEntity.model = ModelComponent(mesh: .generateBox(size: 0.1), materials: [])
                    wg.entities[uuid] = se
                    completeEvent(requestID: cmdInfo.requestID, data: "{createdID: '"+uuid+"'}")

                    childEntities.append(uuid)
                }
            } else if command == "updateEntityPose" {
                if let cmdInfo = getCommandInfo(json: json),
                   let x: Double = json.getValue(lookup: ["data", "position", "x"]),
                   let y: Double = json.getValue(lookup: ["data", "position", "y"]),
                   let z: Double = json.getValue(lookup: ["data", "position", "z"])
                {
                    let wg = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                    if let e = wg.entities[cmdInfo.entityID] {
                        e.modelEntity.position.x = Float(x)
                        e.modelEntity.position.y = Float(y)
                        e.modelEntity.position.z = Float(z)
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
            } else if command == "createWebPanel" {
                if let cmdInfo = getCommandInfo(json: json),
                   let url: String = json.getValue(lookup: ["data", "url"]),
                   let _: String = json.getValue(lookup: ["data", "rawHTML"])
                {
                    let uuid = UUID().uuidString
                    var targetUrl = url
                    if url[...url.index(url.startIndex, offsetBy: 0)] == "/" {
                        var port = ""
                        if let p = webViewNative?.url.port {
                            port = ":"+String(p)
                        }
                        let domain = webViewNative!.url.scheme!+"://"+webViewNative!.url.host()!+port+"/"
                        targetUrl = domain+String(url[url.index(url.startIndex, offsetBy: 1)...])
                    }

                    // TODO: this needs to be cleaned up
                    let wv = wgManager.createWebView(windowGroup: cmdInfo.windowGroupID, windowID: uuid, url: URL(string: targetUrl)!)
                    if wv.loadRequestID != -1 {
                        wv.webViewNative?.webViewHolder.appleWebView?.load(URLRequest(url: URL(string: targetUrl)!))
                    }
                    wv.webViewID = uuid
                    childPages.append(uuid)
                    wv.loadRequestID = cmdInfo.requestID
                    wv.loadRequestWV = self
                }
            } else if command == "destroyWebPanel" {
                if let cmdInfo = getCommandInfo(json: json) {
                    _ = wgManager.destroyWebView(windowGroup: cmdInfo.windowGroupID, windowID: cmdInfo.webPanelID)
                }
            } else if command == "setWebPanelStyle" {
                if let cmdInfo = getCommandInfo(json: json) {
                    let wv = wgManager.getWebView(windowGroup: cmdInfo.windowGroupID, windowID: cmdInfo.webPanelID)
                    wv?.glassEffect = true
                    wv?.visible = true
                    gotStyle = true
                }
            } else if command == "resizeCompleted" {
                // wgManager.getWindowGroup(windowGroup: parentWindowGroupId).resizing = false
            } else if command == "updatePanelContent" {
                if let cmdInfo = getCommandInfo(json: json),
                   let html: String = json.getValue(lookup: ["data", "html"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)

                    d.webViews[cmdInfo.webPanelID]?.webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.updatePanelContent('"+html+"')")
                    d.updateFrame = !d.updateFrame
                }
            } else if command == "updatePanelPose" {
                if let cmdInfo = getCommandInfo(json: json),
                   let x: Double = json.getValue(lookup: ["data", "position", "x"]),
                   let y: Double = json.getValue(lookup: ["data", "position", "y"]),
                   let z: Double = json.getValue(lookup: ["data", "position", "z"]),
                   let width: Double = json.getValue(lookup: ["data", "width"]),
                   let height: Double = json.getValue(lookup: ["data", "height"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                    d.webViews[cmdInfo.webPanelID]?.pose.x = Float(x)
                    d.webViews[cmdInfo.webPanelID]?.pose.y = Float(y)
                    d.webViews[cmdInfo.webPanelID]?.pose.z = Float(z)

                    d.webViews[cmdInfo.webPanelID]?.width = width
                    d.webViews[cmdInfo.webPanelID]?.height = height
                    d.webViews[cmdInfo.webPanelID]?.full = false
                    d.updateFrame = !d.updateFrame
                }
            } else if command == "createDOMModel" {
                if let cmdInfo = getCommandInfo(json: json),
                   let modelID: String = json.getValue(lookup: ["data", "modelID"]),
                   let modelURL: String = json.getValue(lookup: ["data", "modelURL"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                    d.models[modelID] = ModelViewData(url: URL(string: modelURL)!, position: simd_float3(0, 0, 0))

                    let url = URL(string: modelURL)!
                    let downloadSession = URLSession(configuration: URLSession.shared.configuration, delegate: nil, delegateQueue: nil)
                    let downloadTask = downloadSession.downloadTask(with: url, completionHandler: { a, _, _ in

                        do {
                            let fileURL = getDocumentsDirectory().appendingPathComponent("nike3.usdz")
                            // if FileManager.default.fileExists(atPath: fileURL.path()) {
                            // print("remove")
                            // try FileManager.default.removeItem(at: fileURL)
                            try FileManager.default.copyItem(at: a!, to: fileURL)
                            print("Downloaded and copied model")
                            // }

                        } catch {
                            print("Model already exists")
                        }

                        Task {
                            do {
                                let m = try await ModelEntity(contentsOf: getDocumentsDirectory().appendingPathComponent("nike3.usdz"))
                                d.models[modelID]?.entity.entity = m
                                await d.rootEntity.addChild(m)
                            } catch {
                                print("failed to load model: "+error.localizedDescription)
                            }
                        }

                    })
                    downloadTask.resume()
                }

            } else if command == "updateDOMModelPosition" {
                if let cmdInfo = getCommandInfo(json: json),
                   let modelID: String = json.getValue(lookup: ["data", "modelID"]),
                   let x: Double = json.getValue(lookup: ["data", "modelPosition", "x"]),
                   let y: Double = json.getValue(lookup: ["data", "modelPosition", "y"]),
                   let z: Double = json.getValue(lookup: ["data", "modelPosition", "z"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: cmdInfo.windowGroupID)
                    d.models[modelID]?.position.x = Float(x)
                    d.models[modelID]?.position.y = Float(y)
                    d.models[modelID]?.position.z = Float(z)

                    if let e = d.models[modelID]?.entity.entity {
                        e.position = d.models[modelID]!.position
                        d.updateFrame = !d.updateFrame
                    }
                }

            } else if command == "createMesh" {
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
