
import Foundation

var pwaManager = PWAManager()

struct PWAManager: Codable {
    var isLocal: Bool = false

    var start_url: String = "http://localhost:5173"

//    var start_url: String = "http://localhost:5173/webspatial/avp/materialApiTest"

    var scope: String = ""
    var id: String = "com.webspatial.pico"

    var name: String = "WebSpatial"
    var short_name: String = "name"
    var description: String = ""

    var display: PWADisplayMode = .minimal
    var display_override: [PWADisplayMode] = []
    var protocol_handlers: [PWAProtocol] = [PWAProtocol(protocolValue: "web+spatial", url: "./?cmd=%s")]
    var mainScene: XSceneOptionsJSB = .init(
        defaultSize: .init(
            width: 1024,
            height: 768,
            depth: 0.1
        ),
        type: nil,
        resizability: ResizeRange(
            minWidth: 0.5 * 1360,
            minHeight: 0.5 * 1360,
            maxWidth: 2 * 1360,
            maxHeight: 2 * 1360
        ),
        worldScaling: nil,
        worldAlignment: nil,
        baseplateVisibility: nil
    )
    var useMainScene: Bool = true
    private var version: String = "PACKAGE_VERSION"

    mutating func _init() {
        let urlType = start_url.split(separator: "://").first
        if !(urlType == "http" || urlType == "https" || urlType == "ws-file") {
            if scope == "" || scope == "/" {
                scope = "./"
            }
            if scope.hasPrefix("/") {
                scope.removeFirst()
            }
            start_url = "ws-file://static-web/" + start_url
            scope = "ws-file://static-web/" + scope
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

    func getLocalResourceURL(url: String) -> String {
        guard let comps = URLComponents(string: url) else { return url }
        if let scheme = comps.scheme, scheme == "http" || scheme == "https" || scheme == "ws-file" {
            return url
        }
        var newComps = URLComponents()
        newComps.scheme = "ws-file"
        newComps.host = "static-web"
        let path = comps.percentEncodedPath.isEmpty ? url : comps.percentEncodedPath
        newComps.percentEncodedPath = path.hasPrefix("/") ? path : "/" + path
        newComps.percentEncodedQuery = comps.percentEncodedQuery
        newComps.fragment = comps.fragment
        return newComps.string ?? url
    }

    func getVersion() -> String {
        return version
    }
}

enum PWADisplayMode: Codable {
    case minimal
    case standalone
    case fullscreen
}

struct PWAProtocol: Codable {
    var protocolValue: String = ""
    var url: String = ""

    mutating func updateUrl(_ str: String) {
        url = str
    }
}
