//
//  SpatialObject.swift
//  web-spatial
//
//  Created by ByteDance on 9/10/24.
//

import Foundation

class SpatialObject: EventEmitter, Equatable {
    let id = UUID().uuidString
    private var _isDestroyed = false

    var isDestroyed: Bool {
        _isDestroyed
    }

    static func == (lhs: SpatialObject, rhs: SpatialObject) -> Bool {
        return lhs.id == rhs.id
    }

    override init() {
        super.init()
        gSpatialObjectManager.add(self)
    }

    deinit {
        gSpatialObjectManager.remove(self)
    }

    enum Events: String {
        case BeforeDestroyed = "SpatialObject::BeforeDestroyed"
        case Destroyed = "SpatialObject::Destroyed"
    }

    func destroy() {
        emit(event: Events.BeforeDestroyed.rawValue, data: ["object": self])
        onDestroy()
        _isDestroyed = true
        emit(event: Events.Destroyed.rawValue, data: ["object": self])
    }

    func onDestroy() {}
}
