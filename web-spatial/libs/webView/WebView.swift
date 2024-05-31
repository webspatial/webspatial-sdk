//
//  WebView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import typealias RealityKit.ModelEntity
import SwiftUI

func getDocumentsDirectory() -> URL {
    let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
    let documentsDirectory = paths[0]
    return documentsDirectory
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

    @Published var glassEffect = false

    init() {}

    init(url: URL) {
        webViewNative = WebViewNative(url: url)
        webViewNative?.webViewRef = self
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
        glassEffect = false
        //  Remove existing child pages
        if childPages.count > 0 {
            for page in childPages {
                _ = wgManager.destroyWebView(windowGroup: parentWindowGroupId, windowID: page)
            }
            childPages = [String]()
        }
    }

    func onJSScriptMessage(json: JsonParser) {
        if let command: String = json.getValue(lookup: ["command"]) {
            if command == "createWindowGroup" {
                if let windowStyle: String = json.getValue(lookup: ["data", "windowStyle"]),
                   let requestID: Int = json.getValue(lookup: ["requestID"])
                {
                    let uuid = UUID().uuidString
                    let wgd = WindowGroupData(windowStyle: windowStyle, windowGroupID: uuid)

                    wgManager.getWindowGroup(windowGroup: "root").openWindowData = wgd
                    completeEvent(requestID: requestID, data: "{createdID: '"+uuid+"'}")
                }
            } else if command == "createWebPanel" {
                if let url: String = json.getValue(lookup: ["data", "url"]),
                   let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let _: String = json.getValue(lookup: ["data", "rawHTML"]),
                   let requestID: Int = json.getValue(lookup: ["requestID"])
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
                    let wv = wgManager.createWebView(windowGroup: windowGroupID, windowID: uuid, url: URL(string: targetUrl)!)
                    if wv.loadRequestID != -1 {
                        wv.webViewNative?.webViewHolder.appleWebView?.load(URLRequest(url: URL(string: targetUrl)!))
                    }
                    wv.webViewID = uuid
                    childPages.append(uuid)
                    wv.loadRequestID = requestID
                    wv.loadRequestWV = self
                }
            } else if command == "destroyWebPanel" {
                if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let webPanelID: String = json.getValue(lookup: ["data", "webPanelID"]),
                   let _: Int = json.getValue(lookup: ["requestID"])
                {
                    _ = wgManager.destroyWebView(windowGroup: windowGroupID, windowID: webPanelID)
                }
            } else if command == "setWebPanelStyle" {
                if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let webPanelID: String = json.getValue(lookup: ["data", "webPanelID"]),
                   let _: Int = json.getValue(lookup: ["requestID"])
                {
                    let wv = wgManager.getWebView(windowGroup: windowGroupID, windowID: webPanelID)
                    wv?.glassEffect = true
                }
            } else if command == "resizeCompleted" {
                // wgManager.getWindowGroup(windowGroup: parentWindowGroupId).resizing = false
            } else if command == "updatePanelContent" {
                if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let windowID: String = json.getValue(lookup: ["data", "windowID"]),
                   let html: String = json.getValue(lookup: ["data", "html"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: windowGroupID)

                    d.webViews[windowID]?.webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.updatePanelContent('"+html+"')")
                    d.updateFrame = !d.updateFrame
                }
            } else if command == "updatePanelPose" {
                if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let windowID: String = json.getValue(lookup: ["data", "windowID"]),
                   let x: Double = json.getValue(lookup: ["data", "position", "x"]),
                   let y: Double = json.getValue(lookup: ["data", "position", "y"]),
                   let z: Double = json.getValue(lookup: ["data", "position", "z"]),
                   let width: Double = json.getValue(lookup: ["data", "width"]),
                   let height: Double = json.getValue(lookup: ["data", "height"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: windowGroupID)
                    d.webViews[windowID]?.pose.x = Float(x)
                    d.webViews[windowID]?.pose.y = Float(y)
                    d.webViews[windowID]?.pose.z = Float(z)

                    d.webViews[windowID]?.width = width
                    d.webViews[windowID]?.height = height
                    d.webViews[windowID]?.full = false
                    d.updateFrame = !d.updateFrame
                }
            } else if command == "createDOMModel" {
                if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let _: String = json.getValue(lookup: ["data", "windowID"]),
                   let modelID: String = json.getValue(lookup: ["data", "modelID"]),
                   let modelURL: String = json.getValue(lookup: ["data", "modelURL"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: windowGroupID)
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
                if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let _: String = json.getValue(lookup: ["data", "windowID"]),
                   let modelID: String = json.getValue(lookup: ["data", "modelID"]),
                   let x: Double = json.getValue(lookup: ["data", "modelPosition", "x"]),
                   let y: Double = json.getValue(lookup: ["data", "modelPosition", "y"]),
                   let z: Double = json.getValue(lookup: ["data", "modelPosition", "z"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: windowGroupID)
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
