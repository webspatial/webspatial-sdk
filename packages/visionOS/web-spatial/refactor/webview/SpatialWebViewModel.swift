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
    private var stateChangeListeners: [(_ type: String) -> Void] = []
    private var scrollUpdateListeners: [(_ type: CGPoint) -> Void] = []
    private var cmdManager = JSBManager()

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
        }
        controller!.webview!.load(URLRequest(url: URL(string: url)!))
    }

    func getView() -> SpatialWebView {
        if view == nil {
            view = SpatialWebView()
            view!.model = self
            view?.registerWebviewStateChangeInvoke(invoke: onStateChangeInvoke)
        }
        return view!
    }

    func getController() -> SpatialWebController {
        return controller!
    }

    func scrollViewOffset(offset: Float) {
//        view.scorll(offset)
    }

    func addNavigationListener(protocal: String, event: @escaping (_ data: URL) -> Bool) {
        navigationList[protocal] = event
    }

    func addOpenWindowListener(protocal: String, event: @escaping (_ data: URL) -> WebViewElementInfo?) {
        openWindowList[protocal] = event
    }

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

    func addStateListener(_ event: @escaping (_ type: String) -> Void) {
        stateChangeListeners.append(event)
    }

    func removeStateListener(_ event: @escaping (_ type: String) -> Void) {
        stateChangeListeners.removeAll(where: {
            $0 as AnyObject === event as AnyObject
        })
    }

    func addScrollUpdateListener(_ event: @escaping (_ point: CGPoint) -> Void) {
        scrollUpdateListeners.append(event)
    }

    func removeScrollUpdateListener(_ event: @escaping (_ type: CGPoint) -> Void) {
        scrollUpdateListeners.removeAll(where: {
            $0 as AnyObject === event as AnyObject
        })
    }

    func removeAllNavigationListener() {
        navigationList = [:]
    }

    func removeAllOpenWindowListener() {
        openWindowList = [:]
    }

    func removeAllStateListener() {
        stateChangeListeners.removeAll()
    }

    func removeAllListener() {
        removeAllJSBListener()
        removeAllNavigationListener()
        removeAllOpenWindowListener()
        removeAllStateListener()
    }

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

    func fireMockJSB(_ command: String) {
        let promise = JSBManager.Promise { _, _ in }
        onJSBInvoke(command, promise)
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

    private func onStateChangeInvoke(_ type: String) {
        for onStateChange in stateChangeListeners {
            onStateChange(type)
        }
    }

    func onScrollUpdateInvoke(_ point: CGPoint) {
        for onScrollUpdate in scrollUpdateListeners {
            onScrollUpdate(point)
        }
    }

    func destory() {
        onDestroy()
    }

    func evaluateJS(js: String) {
        controller?.callJS(js)
    }
}

struct WebViewElementInfo {
    var id: String
    var element: SpatialWebViewModel
}
