protocol SpatialScrollAble {
    func updateScrollOffset(_ delta: Double)
    func stopScrolling()
    var scrollEnabled: Bool { get }
    var scrollOffset: Vec2 { get }
}
