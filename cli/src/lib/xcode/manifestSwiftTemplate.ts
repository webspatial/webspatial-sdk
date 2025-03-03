export const manifestSwiftTemplate = `
import Foundation

var pwaManager = PWAManager()

struct PWAManager: Codable {
    var isLocal: Bool = false
    var start_url: String = "START_URL"
    var scope: String = "SCOPE"
    var id: String = "AppID"

    var name: String = "AppName"
    var short_name: String = "name"
    var description: String = "Description"

    var display: PWADisplayMode = .minimal
    var display_override: [PWADisplayMode] = []
    var protocol_handlers: [PWAProtocol] = [PWAProtocol(protocolValue: "", url: "")]
    var mainScene: WindowContainerOptions = .init(
        defaultSize: .init(
            width: SceneWidth,
            height: SceneHeight
        ),
        resizability: SceneResizability
    )
    var useMainScene: Bool = true

    mutating func _init() {
        let urlType = start_url.split(separator: "://").first
        if !(urlType == "http" || urlType == "https") {
            start_url = Bundle.main.url(forResource: start_url, withExtension: "", subdirectory: "")!.absoluteString
            scope = "file://" + Bundle.main.bundlePath + "/" + scope
            isLocal = true
        }

        if display_override.count > 0 {
            display = display_override[0]
        }

        for i in 0 ... protocol_handlers.count - 1 {
            let item = protocol_handlers[i]
            protocol_handlers[i].updateUrl(scope + item.url)
        }
    }

    func checkInScope(url: String) -> Bool {
        return url.starts(with: scope)
    }

    // web+spatial://test
    func checkInDeeplink(url: String) -> String {
        var linkUrl: String = url
        for item in protocol_handlers {
            if linkUrl.starts(with: item.protocolValue) {
                let queryString: String = linkUrl.replacingOccurrences(of: item.protocolValue, with: "").addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!
                linkUrl = item.url.replacingOccurrences(of: "%s", with: item.protocolValue + queryString)
            }
        }
        logger.debug(linkUrl)
        return linkUrl
    }
    
    func getLocalResourceURL(url: String) -> String{
        let path:String = String(url.split(separator: "file://").first!.split(separator: "?").first!)
        let root:String = String(url.split(separator: "?").first!)
        let params = String(url.split(separator: "file://" + root).first!)
        var resource:String = Bundle.main.url(forResource: path, withExtension: "", subdirectory: "")?.absoluteString ?? ""
        if resource == "" {
            resource = Bundle.main.url(forResource: "static-web" + path, withExtension: "", subdirectory: "")?.absoluteString ?? ""
        }
        if resource == "" {
            return url
        }
        resource += "?" + params
        return resource
    }
}

enum PWADisplayMode: Codable {
    case minimal
    case standalone
}

struct PWAProtocol: Codable {
    var protocolValue: String = ""
    var url: String = ""

    mutating func updateUrl(_ str: String) {
        url = str
    }
}

`
