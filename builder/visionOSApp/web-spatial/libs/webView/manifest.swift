//
//  manifest.swift
//  web-spatial
//
//  Created by ByteDance on 2024/12/20.
//

let pwaConfig = PWAConfig()

struct PWAConfig: Codable {
    var displayMode: PWADisplayMode = .standalone
    var mainScene: WindowGroupOptions = .init(
        defaultSize: .init(
            width: 1280,
            height: 1280
        ),
        resizability: "automatic"
    )
}

enum PWADisplayMode: Codable {
    case minimal
    case standalone
}
