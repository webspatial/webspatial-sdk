import SwiftUI
import Foundation
@preconcurrency import WebKit

@Observable
class SpatialWebViewModel {
    private let id = UUID().uuidString.prefix(6)
    var url = ""
    private(set) var title: String?
    private var view: SpatialWebView?
    private var controller: SpatialWebController?
    private var navigationList: [String: (_ data: URL) -> Bool] = [:]
    private var openWindowList: [String: (_ data: URL) -> WebViewElementInfo?] = [:]
    private var stateListeners: [SpatialWebViewState: [() -> Void]] = [:]
    private var stateChangeListeners: [(_ type: SpatialWebViewState) -> Void] = []
    private var scrollUpdateListeners: [(_ type: ScrollState, _ point: CGPoint) -> Void] = []
    private var backgroundTransparent: Bool = false

    private var _scrollEnabled = true
    var scrollEnabled: Bool {
        get {
            return _scrollEnabled
        }
        set(newValue) {
            _scrollEnabled = newValue
            controller?.webview?.scrollView.isScrollEnabled = newValue
        }
    }

    var scrollOffset: CGPoint = .zero

    init(url: String?) {
        controller = SpatialWebController()
        self.url = url ?? ""
        controller!.model = self
        print("[SpatialWebViewModel] Created id: \(id)")
        controller?.registerNavigationInvoke(invoke: onNavigationInvoke)
        controller?.registerOpenWindowInvoke(invoke: onOpenWindowInvoke)
        controller?.registerWebviewStateChangeInvoke(invoke: onStateChangeInvoke)
        controller?.registerScrollUpdateInvoke(invoke: onScrollUpdateInvoke)
    }

    func load(_ configuration: WKWebViewConfiguration? = nil, _ spatialId: String? = "") {
        load(url, configuration, spatialId)
    }

    func load(_ url: String, _ configuration: WKWebViewConfiguration? = nil, _ spatialId: String? = "") {
        if controller?.webview == nil {
            _ = WKWebViewManager.Instance.create(controller: controller!, configuration: configuration, spatialId: spatialId)
            controller!.webview?.scrollView.isScrollEnabled = scrollEnabled
            controller!.webview?.isOpaque = backgroundTransparent
        }
        if url.count > 0 {
            controller?.webview!.load(URLRequest(url: URL(string: url)!))
            controller?.startObserving()
        } else {
            controller!.webview?.scrollView.isScrollEnabled = scrollEnabled
            controller!.webview?.isOpaque = backgroundTransparent
        }
    }

    func loadHTML(_ htmlText: String) {
    if controller?.webview == nil {
        _ = WKWebViewManager.Instance.create(controller: controller!)
    }
    
    // Clear navigation delegate for attachment webviews
    controller?.webview?.navigationDelegate = nil
    // controller?.webview?.uiDelegate = nil
    
    controller?.webview?.isOpaque = true
    controller?.webview?.backgroundColor = .white
    
    let fullHTML = """
    <!DOCTYPE html>
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="background: yellow; padding: 20px; font-size: 48px; color: black;">
        \(htmlText)
    </body>
    </html>
    """
    
    print("[loadHTML] Loading into webview: \(Unmanaged.passUnretained(controller!.webview!).toOpaque())")
    controller?.webview!.loadHTMLString(fullHTML, baseURL: Bundle.main.bundleURL)
    
    // Debug
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
        self?.controller?.webview?.evaluateJavaScript("document.body.innerHTML") { result, error in
            print("[loadHTML] Body innerHTML after 0.5s: \(result ?? "nil")")
        }
    }
}

    func getView() -> SpatialWebView {
        if view == nil {
//            print("get spatial webview", id)
            view = SpatialWebView()
            view!.model = self
            view?.registerWebviewStateChangeInvoke(invoke: onStateChangeInvoke)
        }
        return view!
    }

    func getController() -> SpatialWebController {
        return controller!
    }

    func setBackgroundTransparent(_ transparent: Bool) {
        controller!.webview?.isOpaque = !transparent
        backgroundTransparent = !transparent
    }

    func stopScrolling() {
        controller?.webview?.scrollView.stopScrollingAndZooming()
    }

    func setScrollOffset(_ offset: Vec2) {
        controller?.webview?.scrollView.contentOffset.x = offset.x
        controller?.webview?.scrollView.contentOffset.y = offset.y
    }

    func getScrollOffset() -> Vec2 {
        let contentOffset = controller!.webview!.scrollView.contentOffset
        return Vec2(x: contentOffset.x, y: contentOffset.y)
    }

    func setTitle(_ title: String) {
        self.title = title
        controller?.setWebViewTitle(title)
    }

    // events
    // navigation event
    func addNavigationListener(protocal: String, event: @escaping (_ data: URL) -> Bool) {
        navigationList[protocal] = event
    }

    func removeAllNavigationListener() {
        navigationList = [:]
    }

    // open window event
    func addOpenWindowListener(protocal: String, _ event: @escaping (_ data: URL) -> WebViewElementInfo?) {
        openWindowList[protocal] = event
    }

    func removeAllOpenWindowListener() {
        openWindowList = [:]
    }

    // jsb event
    func addJSBListener<T: CommandDataProtocol>(_ dataClass: T.Type, _ event: @escaping (T, @escaping JSBManager.ResolveHandler<Encodable>) -> Void) {
        controller?.registeJSBHandler(dataClass, event)
    }

    func addJSBListener<T: CommandDataProtocol>(_ dataClass: T.Type, _ event: @escaping (@escaping JSBManager.ResolveHandler<Encodable>) -> Void) {
        controller?.registeJSBHandler(dataClass, event)
    }

    func removeJSBListener<T: CommandDataProtocol>(_ dataClass: T.Type) {
        controller?.unregisterJSBHandler(dataClass)
    }

    func removeAllJSBListener() {
        controller?.clearJSBHandler()
    }

    func fireMockJSB(_ command: String) {
        controller?.mockJSB(command)
    }

    // webview state event
    func addStateListener(_ event: @escaping (_ type: SpatialWebViewState) -> Void) {
        stateChangeListeners.append(event)
    }

    func addStateListener(_ state: SpatialWebViewState, _ event: @escaping () -> Void) {
        if stateListeners[state] == nil {
            stateListeners[state] = []
        }
        stateListeners[state]?.append(event)
    }

    func removeStateListener(_ event: @escaping (_ type: String) -> Void) {
        stateChangeListeners.removeAll(where: {
            $0 as AnyObject === event as AnyObject
        })
    }

    func removeStateListener(_ state: SpatialWebViewState, _ event: @escaping (_ object: Any, _ data: Any) -> Void) {
        stateListeners[state]?.removeAll(where: {
            $0 as AnyObject === event as AnyObject
        })
    }

    func removeAllStateListener() {
        stateChangeListeners.removeAll()
        stateListeners = [:]
    }

    func removeStateListener(_ state: SpatialWebViewState) {
        stateListeners[state] = nil
    }

    // scroll update event
    func addScrollUpdateListener(_ event: @escaping (_ type: ScrollState, _ point: CGPoint) -> Void) {
        scrollUpdateListeners.append(event)
    }

    func removeScrollUpdateListener(_ event: @escaping (_ type: ScrollState, _ point: CGPoint) -> Void) {
        scrollUpdateListeners.removeAll(where: {
            $0 as AnyObject === event as AnyObject
        })
    }

    func removeAllScrollUpdateListener() {
        scrollUpdateListeners.removeAll()
    }

    func removeAllListener() {
        removeAllJSBListener()
        removeAllNavigationListener()
        removeAllOpenWindowListener()
        removeAllStateListener()
        removeAllScrollUpdateListener()
    }

    // invokes
    private func onNavigationInvoke(_ url: URL) -> Bool {
        var matchProtocol = false
        for key in navigationList.keys {
            if url.absoluteString.starts(with: key),
               let res = navigationList[key]?(url)
            {
                matchProtocol = res
            }
        }
        return matchProtocol
    }

    private func onOpenWindowInvoke(_ url: URL) -> WebViewElementInfo? {
        var protocolRes: WebViewElementInfo?
        for key in openWindowList.keys {
            if url.absoluteString.starts(with: key),
               let res = openWindowList[key]?(url)
            {
                protocolRes = res
            }
        }
        return protocolRes
    }

    private func onStateChangeInvoke(_ state: SpatialWebViewState) {
        if state == .didMakeView, controller?.webview == nil {
            load()
        }
        for onStateChange in stateChangeListeners {
            onStateChange(state)
        }
        stateListeners[state]?.forEach { onStateChange in
            onStateChange()
        }
    }

    private func onScrollUpdateInvoke(_ type: ScrollState, _ point: CGPoint) {
        for onScrollUpdate in scrollUpdateListeners {
            onScrollUpdate(type, point)
        }
    }

    func destroy() {
        removeAllListener()
        view?.destroy()
        controller?.destroy()
        controller = nil
        view = nil
    }

    func sendWebEvent<T: Encodable>(_ id: String, _ data: T) {
        let encoder = JSONEncoder()
        if let jsonData = try? encoder.encode(data) {
            let dataString = String(data: jsonData, encoding: .utf8)
            controller?.callJS("window.__SpatialWebEvent && window.__SpatialWebEvent({id:'" + id + "', data: " + dataString! + "})")
        }
    }

    func updateWindowKV(_ dict: [String: Any]) {
        var js = ""
        for (key, value) in dict {
            if let num = value as? Double {
                js += "window.\(key)=\(num);"
            } else if let str = value as? String {
                js += "window.\(key)='\(str)';"
            } else if let bool = value as? Bool {
                js += "window.\(key)=\(bool ? "true" : "false");"
            }
        }
        controller?.callJS(js)
    }

    func evaluateJS(_ js: String, completion: @escaping (Any?) -> Void) {
        guard let webview = controller?.webview else {
            completion(nil)
            return
        }

        webview.evaluateJavaScript(js) { result, error in
            if let error = error {
                print("❌ evaluateJavaScript JS error:", error.localizedDescription)
                completion(nil)
                return
            }
            completion(result)
        }
    }
}

enum SpatialWebViewState: String, CaseIterable {
    case didStartLoad
    case didReceive
    case didFinishLoad
    case didFailLoad
    case didUnload
    case didClose
    case didMakeView
    case didUpdateView
    case didDestroyView
}

struct WebViewElementInfo {
    var id: String
    var element: SpatialWebViewModel
}
