import SwiftUI
@preconcurrency import WebKit

@Observable
class SpatialWebViewModel: SpatialObject {
    private(set) var viewState = ""
    var url = ""
    private var view: SpatialWebView?
    private var controller: SpatialWebController?
    private var navigationList: [String: (_ data: URL) -> Bool] = [:]
    private var openWindowList: [String: (_ data: URL) -> WebViewElementInfo?] = [:]
    private var commandList: [String: (_ data: CommandDataProtocol, _ resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) -> Void] = [:]
    private var commandListWithoutData: [String: (_ resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) -> Void] = [:]
    private var stateChangeListeners: [(_ type: SpatialWebViewState) -> Void] = []
    private var scrollUpdateListeners: [(_ type: ScrollState, _ point: CGPoint) -> Void] = []
    private var cmdManager = JSBManager()
    private var isEnableScroll = true

    var scrollOffset: CGPoint = .zero

    init(url: String?) {
        super.init()
        controller = SpatialWebController()
        self.url = url ?? ""
        controller!.model = self
        controller?.registerNavigationInvoke(invoke: onNavigationInvoke)
        controller?.registerOpenWindowInvoke(invoke: onOpenWindowInvoke)
        controller?.registerJSBInvoke(invoke: onJSBInvoke)
        controller?.registerWebviewStateChangeInvoke(invoke: onStateChangeInvoke)
        controller?.registerScrollUpdateInvoke(invoke: onScrollUpdateInvoke)
    }

    func load() {
        load(url)
    }

    func load(_ url: String) {
        if controller!.webview == nil {
            _ = WKWebViewManager.Instance.create(controller: controller!)
            controller!.webview?.scrollView.isScrollEnabled = isEnableScroll
        }
        controller!.webview!.load(URLRequest(url: URL(string: url)!))
    }

    func loadHTML(_ htmlText: String) {
        if controller!.webview == nil {
            _ = WKWebViewManager.Instance.create(controller: controller!)
            controller!.webview?.scrollView.isScrollEnabled = isEnableScroll
        }
        controller!.webview!.loadHTMLString(htmlText, baseURL: nil)
    }

    func getView() -> SpatialWebView {
        if view == nil {
            print("create new webview")
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
        controller!.webview?.isOpaque = transparent
    }

    func enableScroll() {
        isEnableScroll = true
        controller?.webview?.scrollView.isScrollEnabled = isEnableScroll
    }

    func disableScroll() {
        isEnableScroll = false
        controller?.webview?.scrollView.isScrollEnabled = isEnableScroll
    }

    func stopScrolling() {
        controller?.webview?.scrollView.stopScrollingAndZooming()
    }

    func updateScrollOffset(_ delta: CGFloat) {
        controller?.webview?.scrollView.contentOffset.y += delta
    }

    func getScrollOffset() -> CGFloat? {
        return controller?.webview?.scrollView.contentOffset.y
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
    func addOpenWindowListener(protocal: String, event: @escaping (_ data: URL) -> WebViewElementInfo?) {
        openWindowList[protocal] = event
    }

    func removeAllOpenWindowListener() {
        openWindowList = [:]
    }

    // jsb event
    func addJSBListener<T: CommandDataProtocol>(_ dataClass: T.Type, _ event: @escaping (_ data: T, _ resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) -> Void) {
        cmdManager.register(dataClass)
        commandList[dataClass.commandType] = { data, resolve, reject in
            event(data as! T, resolve, reject)
        }
    }

    func addJSBListener<T: CommandDataProtocol>(_ dataClass: T.Type, _ event: @escaping (_ resolve: @escaping () -> Void, _ reject: @escaping (_ code: ReplyCode, _ message: String) -> Void) -> Void) {
        cmdManager.register(dataClass)
        commandListWithoutData[dataClass.commandType] = event
    }

    func removeJSBListener<T: CommandDataProtocol>(_ dataClass: T.Type) {
        cmdManager.remove(dataClass)
        commandList.removeValue(forKey: dataClass.commandType)
        commandListWithoutData.removeValue(forKey: dataClass.commandType)
    }

    func removeAllJSBListener() {
        commandList = [:]
        commandListWithoutData = [:]
        cmdManager.clear()
    }

    func fireMockJSB(_ command: String) {
        let promise = JSBManager.Promise { _, _ in }
        onJSBInvoke(command, promise)
    }

    // webview state event
    func addStateListener(_ event: @escaping (_ type: SpatialWebViewState) -> Void) {
        stateChangeListeners.append(event)
    }

    func removeStateListener(_ event: @escaping (_ type: String) -> Void) {
        stateChangeListeners.removeAll(where: {
            $0 as AnyObject === event as AnyObject
        })
    }

    func removeAllStateListener() {
        stateChangeListeners.removeAll()
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
        var protocolRes = true
        for key in navigationList.keys {
            if url.absoluteString.starts(with: key),
               let res = navigationList[key]?(url)
            {
                protocolRes = res
            }
        }
        return protocolRes
    }

    private func onOpenWindowInvoke(_ url: URL) -> WebViewElementInfo? {
        var protocolRes: WebViewElementInfo? = nil
        for key in openWindowList.keys {
            if url.absoluteString.starts(with: key),
               let res = openWindowList[key]?(url)
            {
                protocolRes = res
            }
        }
        return protocolRes
    }

    private func onJSBInvoke(_ command: String, _ promise: JSBManager.Promise) {
        do {
            let jsbInfo = command.components(separatedBy: "::")
            if jsbInfo.count == 2, jsbInfo[1] != "" {
                let data = try cmdManager.deserialize(cmdType: jsbInfo[0], cmdContent: jsbInfo[1])
                if let action = commandList[jsbInfo[0]] {
                    action(data!, promise.resolve, promise.reject)
                }
            } else {
                if let action = commandListWithoutData[jsbInfo[0]] {
                    action(promise.resolve, promise.reject)
                }
            }
        } catch {}
    }

    private func onStateChangeInvoke(_ type: SpatialWebViewState) {
        for onStateChange in stateChangeListeners {
            onStateChange(type)
        }
    }

    func onScrollUpdateInvoke(_ type: ScrollState, _ point: CGPoint) {
        for onScrollUpdate in scrollUpdateListeners {
            onScrollUpdate(type, point)
        }
    }

    override func onDestroy() {
        removeAllListener()
        cmdManager.clear()
        view?.destroy()
        controller?.destroy()
        controller = nil
        view = nil
    }

    func evaluateJS(js: String) {
        controller?.callJS(js)
    }
}

enum SpatialWebViewState {
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
