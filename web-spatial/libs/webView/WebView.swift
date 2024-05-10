//
//  WebView.swift
//  web-spatial
//
//  Created by ByteDance on 5/9/24.
//

import Foundation
import SwiftUI

class WebView {
    var pose = SIMD3<Float>(0, 0, 0)
    var webView: WebViewNative
    init(url: URL) {
        webView = WebViewNative(url: url)
        webView.webViewRef = self
    }

    func onJSScriptMessage(json: JsonParser) {
        if let command: String = json.getValue(lookup: ["command"]) {
            if command == "createWindowGroup" {
                if let windowStyle: String = json.getValue(lookup: ["data", "windowStyle"]),
                   let name: String = json.getValue(lookup: ["data", "name"])
                {
                    let wgd = WindowGroupData(windowStyleIn: windowStyle, windowGroupIn: name, windowIdIn: "B", url: URL(string: "http://localhost:5173/index2.html")!)

                    wgManager.getWindowGroup(windowGroup: "root").openWindowData = wgd
                }
            } else if command == "createWebPanel" {
                if let url: String = json.getValue(lookup: ["data", "url"]),
                   let windowGroupId: String = json.getValue(lookup: ["data", "windowGroupId"]),
                   let name: String = json.getValue(lookup: ["data", "name"])
                {
                    _ = wgManager.createWebView(windowGroup: windowGroupId, windowId: name, url: URL(string: url)!)
                }
            } else if command == "updatePanelPose" {
                if let windowGroupId: String = json.getValue(lookup: ["data", "windowGroupId"]),
                   let name: String = json.getValue(lookup: ["data", "name"]),
                   let x: String = json.getValue(lookup: ["data", "x"])
                {
                    let d = wgManager.getWindowGroup(windowGroup: windowGroupId)
                    d.webViews[name]?.pose.x = (x as NSString).floatValue
                    d.updateFrame = !d.updateFrame
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
