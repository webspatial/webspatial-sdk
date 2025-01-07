
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
    var cornerRadius: CornerRadius = .init()
    var windowGroupSize = DefaultPlainWindowGroupSize
    var backgroundMaterial: BackgroundMaterial = .None
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

    var rotationAnchor: UnitPoint3D = .center

    // Track the first load event of the webview so we don't see a flash of white before the page loads
    var didFinishFirstLoad = false

    // ID of the webview that created this or empty if its root
    var parentWebviewID: String = ""
    var parentWindowGroupID: String
    var childWindowGroups = [String: WindowGroupData]()
    var spawnedNativeWebviews = [String: WebViewNative]()

    private var childResources = [String: SpatialObject]()
    public func addChildSpatialObject(_ spatialObject: SpatialObject) {
        childResources[spatialObject.id] = spatialObject
        spatialObject
            .on(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
    }

    public func removeChildSpatialObject(_ spatialObject: SpatialObject) {
        spatialObject
            .off(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onSptatialObjectDestroyed
            )
        childResources.removeValue(forKey: spatialObject.id)
    }

    public func getChildSpatialObject(name: String) -> SpatialObject? {
        return childResources[name]
    }

    public func destroyChild(name: String) {
        childResources[name]?.destroy()
    }

    private func onSptatialObjectDestroyed(_ object: Any, _ data: Any) {
        let spatialObject = object as! SpatialObject
        removeChildSpatialObject(spatialObject)
    }

    private func onWindowGroupDestroyed(_ object: Any, _ data: Any) {
        let spatialObject = object as! SpatialWindowGroup
        spatialObject
            .off(
                event: SpatialObject.Events.BeforeDestroyed.rawValue,
                listener: onWindowGroupDestroyed
            )
        childWindowGroups.removeValue(forKey: spatialObject.id)
    }

    public func setWindowGroup(uuid: String, wgd: WindowGroupData) {
        childWindowGroups[uuid] = wgd
        SpatialWindowGroup.getSpatialWindowGroup(uuid)!.on(
            event: SpatialObject.Events.BeforeDestroyed.rawValue,
            listener: onWindowGroupDestroyed
        )
    }

    // Drag event handling
    var dragStarted = false
    var dragStart = 0.0
    var dragVelocity = 0.0

    var gotStyle = false
    var opacity = 1.0
    var cornerRadius: CornerRadius = .init()
    var backgroundMaterial = BackgroundMaterial.None

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

    func setView(wv: WebViewNative) {
        webViewNative = wv
        webViewNative!.webViewRef = self
    }

    func evaluateJS(js: String) {
        webViewNative!.webViewHolder.appleWebView!.evaluateJavaScript(js)
    }

    func getURL() -> URL? {
        return webViewNative?.url
    }

    func setURL(url: URL) {
        webViewNative!.url = url
    }

    func parseURL(url: String) -> String {
        // Compute target url depending if the url is relative or not
        var targetUrl = url
        if url[...url.index(url.startIndex, offsetBy: 0)] == "/" {
            // Absolute path
            var port = ""
            if let p = webViewNative?.url.port {
                port = ":" + String(p)
            }
            let domain = webViewNative!.url.scheme! + "://" + webViewNative!.url.host()! + port + "/"
            targetUrl = domain + String(url[url.index(url.startIndex, offsetBy: 1)...])
        } else {
            // Full url eg. http://domain.com
            if let parsed = URL(string: url) {
                if parsed.scheme != nil {
                    return url
                }
            }
            // Reletive path
            let localDir = NSString(string: webViewNative!.url.absoluteString)
            let relPath = String(localDir.deletingLastPathComponent) + "/" + targetUrl
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

    deinit {
//        wgManager.wvActiveInstances -= 1
        webViewNative!.destroy()
    }

    func completeEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: true, requestID:" + String(requestID) + ", data: " + data + "})")
    }

    func fireGestureEvent(inputComponentID: String, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({inputComponentID:'" + inputComponentID + "', data: " + data + "})")
    }

    func failEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: false, requestID:" + String(requestID) + ", data: " + data + "})")
    }

    // Request information of webview that request this webview to load
    weak var loadRequestWV: SpatialWindowComponent?
    var loadRequestID = -1
//    var resourceID = ""
    // A load request of a child webview was loaded
    func didLoadChild(loadRequestID: Int, resourceID: String) {
        completeEvent(requestID: loadRequestID, data: "{createdID: '" + id + "'}")
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
        wv.webViewHolder.appleWebView!.evaluateJavaScript("window._webSpatialID = '" + uuid + "'")
        spawnedNativeWebviews[uuid] = wv
    }

    func didStartReceivePageContent() {}

    func didGetEarlyStyle(style: PreloadStyleSettings) {
        if let cornerRadius = style.cornerRadius {
            loadingStyles.cornerRadius = cornerRadius
        }

        if let backgroundMaterial = style.backgroundMaterial {
            loadingStyles.backgroundMaterial = backgroundMaterial
        }
    }

    func didFinishLoadPage() {
        didFinishFirstLoad = true
        cornerRadius = loadingStyles.cornerRadius
        backgroundMaterial = loadingStyles.backgroundMaterial

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
}
