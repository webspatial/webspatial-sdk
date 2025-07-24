import SwiftUI
@preconcurrency import WebKit

@Observable
class SpatialWebViewModel {
    private(set) var viewState = ""
    var url = ""
    private var view: SpatialWebView
    private var controller: SpatialWebController?
    private var navigationList: [String: (_ data: String) -> Any] = [:]
    private var openWindowList: [String: (_ data: String) -> Any] = [:]
    private var protocolList: [String: (_ data: String) -> Any] = [:]
    private var commandList: [String: (_ data: Any) -> Any] = [:]
    private var cmdManager = JSBManager()

    var scrollOffset: CGPoint = .zero

    init(url: String?) {
        controller = SpatialWebController()

        view = SpatialWebView()

        view.controller = controller!
        view.initView()
        self.url = url ?? ""

        controller!.model = self
        view.model = self

        controller?.registerNavigationInvoke(invoke: onNavigationInvoke)
        controller?.registerOpenWindowInvoke(invoke: onOpenWindowInvoke)
        controller?.registerJSBInvoke(invoke: onJSBInvoke)
    }

    func load() {
        print("load", url)
        load(url)
    }

    func load(_ url: String) {
        view.load(url: url)
    }

    func getView() -> SpatialWebView {
        return view
    }

    func onWebViewUpdate(type: String) {
        print(type)
        switch type {
        case "view:updateUI":
//            load()
            break
        case "controller:didStartLoadPage":
            viewState = "startLoad"
        case "controller:didReceivePageContent":
            viewState = "loading"
        case "controller:didFinishLoadPage":
            viewState = "finishLoad"
        case "controller:didFailLoadPage":
            viewState = "failLoad"
        default:
            return
        }
    }

    func onUpdateScroll(point: CGPoint) {
        scrollOffset = point
    }

    func successCallBack(data: String) {}

    func failCallback(data: String) {}

    func postWebMessage(id: String, data: String) {}

    func scrollViewOffset(offset: Float) {
//        view.scorll(offset)
    }

    func addNavigationListener(protocal: String, event: @escaping (_ data: String) -> Any) {
        navigationList[protocal] = event
    }

    func addOpenWindowListener(protocal: String, event: @escaping (_ data: String) -> Any) {
        openWindowList[protocal] = event
    }

    func addJSBListener<T: CommandDataProtocol>(_ dataClass: T.Type, _ event: @escaping (_ data: T) -> Any) {
        cmdManager.register(dataClass)
        commandList[dataClass.commandType] = { data in
            guard let concreteData = data as? T else {
                print("Command Type mismatch")
                return
            }
            return event(concreteData)
        }
    }

    private func onNavigationInvoke(_ url: String) -> Any {
        var protocolRes: Any? = nil
        for key in navigationList.keys {
            if url.starts(with: key),
               let res = navigationList[key]?(url)
            {
                protocolRes = res
            }
        }
        return protocolRes
    }

    private func onOpenWindowInvoke(_ url: String) -> Any {
        var protocolRes: Any? = nil
        for key in openWindowList.keys {
            if url.starts(with: key),
               let res = openWindowList[key]?(url)
            {
                protocolRes = res
            }
        }
        return protocolRes
    }

    // todo
    // parse codable
    private func onJSBInvoke(_ command: String) -> Result<CommandDataProtocol, JSBManager.SerializationError> {
        do {
            let jsbInfo = command.components(separatedBy: "::")
            if jsbInfo.count == 2 {
                let data = try cmdManager.deserialize(cmdType: jsbInfo[0], cmdContent: jsbInfo[1])
                if let action = commandList[jsbInfo[0]] {
                    _ = action(data)
                }
                return .success(data)
            }
            return .failure(.unknownType)
        } catch _ as JSBManager.SerializationError {
            return .failure(.unknownType)
        } catch {
            return .failure(.invalidFormat)
        }
    }

    func evaluateJS(js: String) {
        view.callJS(js: js)
    }

    func destory() {
        protocolList = [:]
        commandList = [:]
    }
}
