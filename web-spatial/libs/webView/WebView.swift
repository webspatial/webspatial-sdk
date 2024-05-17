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

class WebView {
    var scrollOffset = CGPoint()
    var pose = SIMD3<Float>(0, 0, 0)
    var webView: WebViewNative

    var full = true
    var width: Double = 0
    var height: Double = 0

    var parent: WindowGroupContentDictionary?

    init(url: URL) {
        webView = WebViewNative(url: url)
        webView.webViewRef = self
    }

    func onJSScriptMessage(json: JsonParser) {
        if let command: String = json.getValue(lookup: ["command"]) {
            if command == "createWindowGroup" {
                if let windowStyle: String = json.getValue(lookup: ["data", "windowStyle"]),
                   let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"])
                {
                    let wgd = WindowGroupData(windowStyle: windowStyle, windowGroupID: windowGroupID)

                    wgManager.getWindowGroup(windowGroup: "root").openWindowData = wgd
                }
            } else if command == "createWebPanel" {
                if let url: String = json.getValue(lookup: ["data", "url"]),
                   let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let windowID: String = json.getValue(lookup: ["data", "windowID"]),
                   let rawHTML: String = json.getValue(lookup: ["data", "rawHTML"])
                {
                    var targetUrl = url
                    if url[...url.index(url.startIndex, offsetBy: 0)] == "/" {
                        var port = ""
                        if let p = webView.url.port {
                            port = ":"+String(p)
                        }
                        let domain = webView.url.scheme!+"://"+webView.url.host()!+port+"/"
                        targetUrl = domain+String(url[url.index(url.startIndex, offsetBy: 1)...])
                    }

                    _ = wgManager.createWebView(windowGroup: windowGroupID, windowID: windowID, url: URL(string: targetUrl)!)
                }
            } else if command == "updatePanelContent" {
                if let windowGroupID: String = json.getValue(lookup: ["data", "windowGroupID"]),
                   let windowID: String = json.getValue(lookup: ["data", "windowID"]),
                   let html: String = json.getValue(lookup: ["data", "html"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: windowGroupID)

                    d.webViews[windowID]?.webView.webViewHolder.gWebView?.evaluateJavaScript("window.updatePanelContent('"+html+"')")
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
                                print("model A")
                                let m = try await ModelEntity(contentsOf: getDocumentsDirectory().appendingPathComponent("nike3.usdz"))
                                print("model B")
                                d.models[modelID]?.entity.entity = m
                                print("model C")
                                await d.rootEntity.addChild(m)
                                print("model loaded")
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
                    d.models[modelID]!.position.x = Float(x)
                    d.models[modelID]!.position.y = Float(y)
                    d.models[modelID]!.position.z = Float(z)

                    if let e = d.models[modelID]?.entity.entity {
                        e.position = d.models[modelID]!.position
                        d.updateFrame = !d.updateFrame
                    }
                }

            } else if command == "createMesh" {
            } else if command == "openImmersiveSpace" {
                wgManager.getWindowGroup(windowGroup: "root").x = true
            } else if command == "dismissImmersiveSpace" {
                wgManager.getWindowGroup(windowGroup: "root").x = false
            } else if command == "log" {
                if let logString: String = json.getValue(lookup: ["data", "logString"]) {
                    print(logString)
                }
            }
        }
    }
}
