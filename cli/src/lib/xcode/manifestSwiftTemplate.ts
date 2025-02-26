export const manifestSwiftTemplate = `
import Foundation

var pwaManager = PWAManager()

struct PWAManager: Codable {
    var start_url: String = "START_URL"
    var scope: String = "SCOPE"
    var id: String = ""

    var name: String = "AppName"
    var short_name: String = "name"
    var description: String = "description"

    var display: PWADisplayMode = .minimal
    var display_override: [PWADisplayMode] = []
    var protocol_handlers: [PWAProtocol] = [PWAProtocol(protocolValue: "", url: "")]
    var mainScene: WindowContainerOptions = .init(
        defaultSize: .init(
            width: 1280,
            height: 1280
        ),
        resizability: "automatic"
    )
    var useMainScene: Bool = true

    mutating func _init() {
        let urlType = start_url.split(separator: "://").first
        if !(urlType == "http" || urlType == "https") {
            start_url = Bundle.main.url(forResource: start_url, withExtension: "", subdirectory: "")!.absoluteString
            scope = "file://" + Bundle.main.bundlePath + "/" + scope
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
