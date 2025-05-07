import Combine
import Foundation
import RealityKit
import SwiftUI
import WebKit

let DefaultPlainWindowContainerSize = CGSize(width: 1280, height: 720)

func getDocumentsDirectory() -> URL {
    let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
    let documentsDirectory = paths[0]
    return documentsDirectory
}

struct LoadingStyles {
    var cornerRadius: CornerRadius = .init()
    var windowContainerSize = DefaultPlainWindowContainerSize
    var backgroundMaterial: BackgroundMaterial = .None
}

class NavInfo: ObservableObject {
    @Published var url: String = ""
}

@Observable
class SpatialWindowComponent: SpatialComponent {
    override func inspect() -> [String: Any] {
        let childEntitiesInfo = childResources.mapValues { spatialObject in
            spatialObject.inspect()
        }

        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted

        var inspectInfo: [String: Any] = [
            "scrollWithParent": scrollWithParent,
            "resolutionX": resolutionX,
            "resolutionY": resolutionY,
            "parentWebviewID": parentWebviewID,
            "parentWindowContainerID": parentWindowContainerID,
            "childWindowContainers": childWindowContainers,
            "spawnedNativeWebviewsCount": spawnedNativeWebviews.count,
            "childResources": childEntitiesInfo,
            "cornerRadius": cornerRadius.toJson(),
            "backgroundMaterial": backgroundMaterial.rawValue,
            "isOpaque": webViewNative!.webViewHolder.appleWebView!.isOpaque,
            "isScrollEnabled": isScrollEnabled(),
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
    var parentWindowContainerID: String
    var childWindowContainers = [String: WindowContainerData]()
    var spawnedNativeWebviews = [String: WebViewNative]()
    var navInfo = NavInfo()

    // Resources that will be destroyed when this webpage is destoryed or if it is navigated away from
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

    private func onWindowContainerDestroyed(_ object: Any, _ data: Any) {
        if let spatialObject = object as? SpatialWindowContainer {
            spatialObject
                .off(
                    event: SpatialObject.Events.BeforeDestroyed.rawValue,
                    listener: onWindowContainerDestroyed
                )
            childWindowContainers.removeValue(forKey: spatialObject.id)
        }
    }

    /// Determines whether the current webview is a root webview.
    ///
    /// A root webview is created when the Scene is initialized.
    /// If the webview is created by another `SpatialWebview`, it is not considered a root webview.
    /// For example, a `SpatialDiv` is not a root webview.
    ///
    /// - Returns: `true` if the webview is a root webview (i.e., `parentWebviewID` is empty), otherwise `false`.
    public func isRootWebview() -> Bool {
        return parentWebviewID == ""
    }

    public func setWindowContainer(uuid: String, wgd: WindowContainerData) {
        childWindowContainers[uuid] = wgd
        SpatialWindowContainer.getSpatialWindowContainer(uuid)!.on(
            event: SpatialObject.Events.BeforeDestroyed.rawValue,
            listener: onWindowContainerDestroyed
        )
    }

    // Drag event handling
    var dragStarted = false
    var dragStart = 0.0
    var dragVelocity = 0.0

    var gotStyle = false
    var opacity = 1.0
    var cornerRadius: CornerRadius = .init()

    private var _backgroundMaterial = BackgroundMaterial.None
    var backgroundMaterial: BackgroundMaterial {
        get {
            return _backgroundMaterial
        }
        set(newValue) {
            _backgroundMaterial = newValue
            if isRootWebview() {
                webViewNative?.webViewHolder.appleWebView?.isOpaque = _backgroundMaterial == .None
            } else {
                // it's spatial div
                webViewNative?.webViewHolder.appleWebView?.isOpaque = false
            }
        }
    }

    var loadingStyles = LoadingStyles()
    var isLoading = true

    var didFailLoad = false

    private var cancellables = Set<AnyCancellable>() // save subscriptions

    init(parentWindowContainerID: String) {
        self.parentWindowContainerID = parentWindowContainerID
        super.init()
        webViewNative = WebViewNative()
        webViewNative?.webViewRef = self
        _ = webViewNative?.createResources()
        registerForceStyle()
    }

    init(parentWindowContainerID: String, url: URL) {
        self.parentWindowContainerID = parentWindowContainerID
        super.init()

        webViewNative = WebViewNative(url: url)
        webViewNative?.webViewRef = self
        _ = webViewNative?.createResources()
        registerForceStyle()
    }

    func initFromURL(url: URL) {
        webViewNative = WebViewNative(url: url)
        webViewNative?.webViewRef = self
        _ = webViewNative?.createResources()
        registerForceStyle()
    }

    // the url schema handler for forcestyle cannot bind seperately for every webview due to apple limitation. So this is a workaround like eventbus, webview will handle the message that has matched webview.
    func registerForceStyle() {
        webviewGetEarlyStyleData
            .filter { [weak self] event in
                self?.getView()?.webViewHolder.appleWebView == event.webview
            }
            .sink { [weak self] event in
                self?.didGetEarlyStyle(style: event.style)
            }
            .store(in: &cancellables)
    }

    func goBack() {
        webViewNative?.webViewHolder.appleWebView?.goBack()
    }

    func goForward() {
        webViewNative?.webViewHolder.appleWebView?.goForward()
    }

    func reload() {
        webViewNative?.webViewHolder.appleWebView?.reload()
    }

    var canGoBack: Bool = false

    var canGoForward: Bool = false

    func navigateToURL(url: URL) {
        webViewNative!.url = url
        webViewNative!.webViewHolder.needsUpdate = true
        webViewNative!.initialLoad()
    }

    /// Remove webview window.name
    ///
    /// The expectation is that when the app is reopened, the root page should not have a window.name. However, under the current scene mechanism, if the last closed scene had set a window.name, it will still exist the next time the app is opened.
    ///
    /// Currently, window.name is only deleted when non-main scenes are closed along with the destruction of the WebView.
    ///
    /// the root page should always have a blank name

    func removeWebviewName(completion: (() -> Void)? = nil) {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.name = '';") { _, _ in
            completion?()
        }
    }

    func isScrollEnabled() -> Bool {
        return webViewNative!.webViewHolder.appleWebView!.scrollView.isScrollEnabled
    }

    /// Finds the nearest ancestor `SpatialWindowComponent` that has scrolling enabled.
    ///
    /// This method traverses the entity hierarchy upwards, starting from the current `SpatialWindowComponent`,
    /// and checks each ancestor `SpatialWindowComponent` to see if scrolling is enabled. If a suitable
    /// component is found, it is returned; otherwise, `nil` is returned.
    ///
    /// - Returns: The nearest ancestor `SpatialWindowComponent` with scrolling enabled, or `nil` if none is found.
    func findNearestScrollEnabledSpatialWindowComponent() -> SpatialWindowComponent? {
        var current: SpatialWindowComponent? = self
        while current != nil {
            if current!.isScrollEnabled() {
                return current!
            }
            if let parentEntity = current?.entity?.parent {
                current = parentEntity.getComponent(SpatialWindowComponent.self)
            } else {
                current = nil
            }
        }
        return current
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
        if !pwaManager.isLocal {
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
        } else {
            if !(targetUrl.starts(with: "http://") || targetUrl.starts(with: "https://")) {
                targetUrl = pwaManager.getLocalResourceURL(url: targetUrl)
            }
        }
        return targetUrl
    }

    func readWindowContainerID(id: String) -> String {
        if id == "current" {
            return parentWindowContainerID
        } else {
            return id
        }
    }

    deinit {
        webViewNative!.destroy()
        cancellables.removeAll()
    }

    func completeEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: true, requestID:" + String(requestID) + ", data: " + data + "})")
    }

    func fireComponentEvent(componentId: String, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({resourceId:'" + componentId + "', data: " + data + "})")
    }

    func failEvent(requestID: Int, data: String = "{}") {
        webViewNative?.webViewHolder.appleWebView?.evaluateJavaScript("window.__SpatialWebEvent({success: false, requestID:" + String(requestID) + ", data: " + data + "})")
    }

    // Request information of webview that request this webview to load
    weak var loadRequestWV: SpatialWindowComponent?
    var loadRequestID = -1

    // A load request of a child webview was loaded
    func didLoadChild(loadRequestID: Int, resourceID: String) {
        completeEvent(requestID: loadRequestID, data: "{createdID: '" + id + "'}")
    }

    func didFailLoadPage() {
        didFailLoad = true
        didFinishFirstLoad = true
    }

    func releaseChildResources() {
        let spatialObjects = childResources.map { $0.value }
        for spatialObject in spatialObjects {
            spatialObject.destroy()
        }
        childResources = [String: SpatialObject]()
        spawnedNativeWebviews = [String: WebViewNative]()

        let wgkeys = childWindowContainers.map { $0.key }
        for k in wgkeys {
            SpatialWindowContainer.getSpatialWindowContainer(k)!.closeWindowData.send(childWindowContainers[k]!)
        }
    }

    func didStartLoadPage() {
        if didFinishFirstLoad {
            webViewNative!.webViewHolder.appleWebView!.evaluateJavaScript("window.__WebSpatialUnloaded = true")
        }

        releaseChildResources()
        let url = webViewNative?.webViewHolder.appleWebView?.url
        webViewNative!.url = url!

        // Mark that we havn't gotten a style update
        gotStyle = false
        isLoading = true
        loadingStyles = LoadingStyles()

        // FIXME:
        // This is a workaround to force run UIViewRepresentable.update()
        // SwiftUI not trigger it when go back from example page.
        // Warning of `AttributeGraph: cycle detected through attribute` fired when goes to example page
        webViewNative?.initialLoad()
    }

    func didSpawnWebView(wv: WebViewNative) {
        let uuid = UUID().uuidString
        wv.webViewHolder.appleWebView!.evaluateJavaScript("window._webSpatialID = '" + uuid + "'")
        spawnedNativeWebviews[uuid] = wv
    }

    func didCloseWebView() {
        // if need
        if isRootWebview() {
            SceneManager.Instance.closeRoot(self)
        }
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
        didFailLoad = false
        cornerRadius = loadingStyles.cornerRadius
        backgroundMaterial = loadingStyles.backgroundMaterial

        isLoading = false

        // update navinfo
        if let wv = webViewNative?.webViewHolder.appleWebView {
            canGoBack = wv.canGoBack
            canGoForward = wv.canGoForward
        }
    }

    override func onDestroy() {
        releaseChildResources()
        didCloseWebView()
    }

    func didNavBackForward() {
        // in JS calling history.go(-1) we should set needUpdate=true
        webViewNative?.webViewHolder.needsUpdate = true
    }
}
