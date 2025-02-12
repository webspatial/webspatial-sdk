//
//  manifest.swift
//  web-spatial
//
//  Created by ByteDance on 2024/12/20.
//
import Foundation

var pwaManager = PWAManager()

struct PWAManager: Codable {
    var start_url: String = "http://localhost:5173"
    // var start_url:String = "static-web/index.html"
    var scope: String = ""
    var id: String = ""

    var name: String = "应用名称"
    var short_name: String = "名称"
    var description: String = "应用描述"

    var display: PWADisplayMode = .minimal
    var display_override: [PWADisplayMode] = []
    var protocol_handlers: [PWAProtocol] = [PWAProtocol(protocolValue: "web+spatial://", url: "build/deeplink.html?path=%s")]
    var mainScene: WindowGroupOptions = .init(
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
            scope = "file://" + Bundle.main.bundlePath + scope
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
        print(linkUrl)
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
