
import Foundation

var pwaManager = PWAManager()

struct PWAManager: Codable {
    var isLocal: Bool = false
    var start_url: String = "http://localhost:5173/"
    var scope: String = ""
    var id: String = "com.webspatial.pico"

    var name: String = "WebSpatial"
    var short_name: String = "name"
    var description: String = ""

    var display: PWADisplayMode = .minimal
    var display_override: [PWADisplayMode] = []
    var protocol_handlers: [PWAProtocol] = [PWAProtocol(protocolValue: "web+spatial", url: "./?cmd=%s")]
    var mainScene: WindowContainerOptions = .init(
        defaultSize: .init(
            width: 1280,
            height: 720
        ),
        resizability: nil
    )
    var useMainScene: Bool = true
    private var version: String = "PACKAGE_VERSION"

    mutating func _init() {
        let urlType = start_url.split(separator: "://").first
        if !(urlType == "http" || urlType == "https") {
            if scope == "" || scope == "/" {
                scope = "./"
            }
            let startUrl = Bundle.main.url(forResource: start_url, withExtension: "", subdirectory: "")
            start_url = startUrl!.absoluteString
            scope = URL(string: scope, relativeTo: startUrl)!.absoluteString
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
        let path = String(url.split(separator: "file://").first!.split(separator: "?").first!)
        let newUrl = URL(string: url)
        let fileManager = FileManager.default
        if fileManager.fileExists(atPath: newUrl!.path) {
            return url
        }
        var resource: String = Bundle.main.url(forResource: newUrl?.path, withExtension: "", subdirectory: "")?.absoluteString ?? ""
        if resource == "" {
            resource = Bundle.main.url(forResource: "static-web" + path, withExtension: "", subdirectory: "")?.absoluteString ?? ""
        }
        if resource == "" {
            return url
        }
        if newUrl?.query() != nil {
            resource += "?" + (newUrl?.query())!
        }
        if newUrl?.fragment() != nil {
            resource += "#" + (newUrl?.fragment())!
        }
        return resource
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
