import CoreFoundation

protocol SpatialScrollAble {
    func updateDeltaScrollOffset(_ delta: Vec2)
    func stopScrolling()
    var scrollPageEnabled: Bool { get }
    var scrollOffset: Vec2 { get }
}
