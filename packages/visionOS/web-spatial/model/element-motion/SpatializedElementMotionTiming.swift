import Foundation

// MARK: - Loop Configuration

/// Loop configuration decoded from JS bridge.
/// Supports: true (reset loop), { reverse: true } (reverse loop), false/nil (play once).
enum SpatializedMotionLoopConfig: Decodable {
    case none
    case resetLoop
    case reverseLoop

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        // Try bool first
        if let boolVal = try? container.decode(Bool.self) {
            self = boolVal ? .resetLoop : .none
            return
        }

        // Try object { reverse?: Bool }
        struct LoopObject: Decodable {
            let reverse: Bool?
        }
        if let obj = try? container.decode(LoopObject.self) {
            self = (obj.reverse == true) ? .reverseLoop : .resetLoop
            return
        }

        self = .none
    }
}

// MARK: - Timing Functions

/// Cubic bezier timing functions for manual frame interpolation.
enum SpatializedMotionTimingFunction {
    case linear
    case easeIn
    case easeOut
    case easeInOut

    /// Evaluate the timing function at progress t (0...1) -> output (0...1)
    func evaluate(_ t: Double) -> Double {
        switch self {
        case .linear:
            return t
        case .easeIn:
            // cubic-bezier(0.42, 0, 1, 1)
            return cubicBezier(t, x1: 0.42, y1: 0.0, x2: 1.0, y2: 1.0)
        case .easeOut:
            // cubic-bezier(0, 0, 0.58, 1)
            return cubicBezier(t, x1: 0.0, y1: 0.0, x2: 0.58, y2: 1.0)
        case .easeInOut:
            // cubic-bezier(0.42, 0, 0.58, 1)
            return cubicBezier(t, x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0)
        }
    }

    /// Solve cubic bezier curve for Y given input T (time fraction).
    private func cubicBezier(_ t: Double, x1: Double, y1: Double, x2: Double, y2: Double) -> Double {
        if x1 == 0 && y1 == 0 && x2 == 1 && y2 == 1 {
            return t
        }

        // Newton-Raphson to solve for bezier parameter given x = t
        var guessT = t
        for _ in 0 ..< 8 {
            let currentX = sampleCurveX(guessT, x1: x1, x2: x2)
            let derivative = sampleCurveDerivativeX(guessT, x1: x1, x2: x2)
            if abs(derivative) < 1e-6 { break }
            guessT -= (currentX - t) / derivative
        }
        guessT = max(0.0, min(1.0, guessT))
        return sampleCurveY(guessT, y1: y1, y2: y2)
    }

    private func sampleCurveX(_ t: Double, x1: Double, x2: Double) -> Double {
        return ((1.0 - 3.0 * x2 + 3.0 * x1) * t + (3.0 * x2 - 6.0 * x1)) * t * t + 3.0 * x1 * t
    }

    private func sampleCurveY(_ t: Double, y1: Double, y2: Double) -> Double {
        return ((1.0 - 3.0 * y2 + 3.0 * y1) * t + (3.0 * y2 - 6.0 * y1)) * t * t + 3.0 * y1 * t
    }

    private func sampleCurveDerivativeX(_ t: Double, x1: Double, x2: Double) -> Double {
        return (3.0 * (1.0 - 3.0 * x2 + 3.0 * x1) * t + 2.0 * (3.0 * x2 - 6.0 * x1)) * t + 3.0 * x1
    }

    static func from(name: String) -> SpatializedMotionTimingFunction {
        switch name {
        case "linear": return .linear
        case "easeIn": return .easeIn
        case "easeOut": return .easeOut
        case "easeInOut": return .easeInOut
        default: return .easeInOut
        }
    }
}
