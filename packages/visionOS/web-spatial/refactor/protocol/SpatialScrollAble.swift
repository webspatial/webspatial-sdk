import CoreFoundation

protocol SpatialScrollAble {
    func updateScrollOffset(_ delta: CGFloat)
    func stopScrolling()
    var scrollEnabled: Bool { get }
    var scrollOffset: Vec2 { get }
}
