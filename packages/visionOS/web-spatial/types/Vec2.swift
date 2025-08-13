import CoreFoundation

struct Vec2: Codable {
    var x: CGFloat
    var y: CGFloat
}

extension Vec2 {
    static func + (left: Vec2, right: Vec2) -> Vec2 {
        return Vec2(x: left.x + right.x, y: left.y + right.y)
    }
}
