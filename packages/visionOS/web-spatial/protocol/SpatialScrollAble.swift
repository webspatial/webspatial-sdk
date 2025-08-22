import CoreFoundation

protocol SpatialScrollAble {
    func updateDeltaScrollOffset(_ delta: Vec2)
    func stopScrolling()
    var scrollEnabled: Bool { get }
    var scrollOffset: Vec2 { get }
}
