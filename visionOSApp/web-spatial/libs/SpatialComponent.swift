//
//  SpatialComponent.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Foundation

class SpatialComponent: SpatialObject {
    weak var entity: SpatialEntity? = nil

    func onAddToEntity() {}

    override func onDestroy() {
        entity = nil
    }

    override func inspect() -> [String: Any] {
        var inspectInfo: [String: Any] = [
            "entity": entity?.id,
            "type": String(describing: type(of: self))
        ]

        let baseInspectInfo = super.inspect()
        for (key, value) in baseInspectInfo {
            inspectInfo[key] = value
        }
        return inspectInfo
    }
}
