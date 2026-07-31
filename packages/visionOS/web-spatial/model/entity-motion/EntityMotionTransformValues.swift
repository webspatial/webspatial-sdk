import Foundation
import RealityKit
import simd

/// Pure transform conversion and sparse-update helpers for entity motion.
enum EntityMotionTransformValues {
    /// Composes right-handed local Euler degrees as `Rz × Ry × Rx`.
    static func composeEulerZYX(_ degrees: SIMD3<Double>) -> simd_quatd {
        let radians = degrees * (.pi / 180)
        let x = simd_quatd(angle: radians.x, axis: .init(1, 0, 0))
        let y = simd_quatd(angle: radians.y, axis: .init(0, 1, 0))
        let z = simd_quatd(angle: radians.z, axis: .init(0, 0, 1))
        return simd_normalize(z * y * x)
    }

    /// Decomposes a quaternion into deterministic canonical ZYX Euler degrees.
    static func decomposeEulerZYX(_ quaternion: simd_quatd) throws -> SIMD3<Double> {
        guard quaternion.vector.x.isFinite,
              quaternion.vector.y.isFinite,
              quaternion.vector.z.isFinite,
              quaternion.vector.w.isFinite,
              simd_length_squared(quaternion.vector) > 0
        else {
            throw EntityMotionCompilationError.unrepresentableTransform(
                "Quaternion is non-finite or has zero length."
            )
        }

        let matrix = simd_double3x3(simd_normalize(quaternion))
        let sineY = min(max(-matrix[0][2], -1), 1)
        let isGimbalLock = 1 - abs(sineY) <= 1e-7
        let y = isGimbalLock ? sineY.sign == .minus ? -.pi / 2 : .pi / 2 : asin(sineY)
        let x: Double
        let z: Double
        if !isGimbalLock {
            x = atan2(matrix[1][2], matrix[2][2])
            z = atan2(matrix[0][1], matrix[0][0])
        } else {
            x = sineY >= 0
                ? atan2(matrix[1][0], matrix[2][0])
                : atan2(-matrix[1][0], -matrix[2][0])
            z = 0
        }

        return .init(
            canonicalDegrees(x * 180 / .pi),
            canonicalDegrees(y * 180 / .pi),
            canonicalDegrees(z * 180 / .pi)
        )
    }

    /// Applies sparse axes to a canonicalized baseline pose.
    static func merge(
        _ update: EntityMotionTransformPayload,
        onto baseline: EntityMotionPose
    ) throws -> EntityMotionPose {
        guard containsScalar(update) else {
            throw EntityMotionCompilationError.invalidSetValues(
                "Set values require at least one transform axis."
            )
        }
        let canonicalRotation = try decomposeEulerZYX(
            composeEulerZYX(baseline.rotation)
        )
        let position = try merge(
            update.position,
            onto: baseline.position,
            requiresNonnegativeValue: false
        )
        let rotation = try merge(
            update.rotation,
            onto: canonicalRotation,
            requiresNonnegativeValue: false
        )
        let scale = try merge(
            update.scale,
            onto: baseline.scale,
            requiresNonnegativeValue: true
        )
        return .init(position: position, rotation: rotation, scale: scale)
    }

    /// Reads one complete pose directly from RealityKit Transform components.
    static func decompose(_ transform: Transform) throws -> EntityMotionPose {
        let position = SIMD3<Double>(
            Double(transform.translation.x),
            Double(transform.translation.y),
            Double(transform.translation.z)
        )
        let scale = SIMD3<Double>(
            Double(transform.scale.x),
            Double(transform.scale.y),
            Double(transform.scale.z)
        )
        guard position.x.isFinite, position.y.isFinite, position.z.isFinite,
              scale.x.isFinite, scale.y.isFinite, scale.z.isFinite,
              scale.x >= 0, scale.y >= 0, scale.z >= 0
        else {
            throw EntityMotionCompilationError.unrepresentableTransform(
                "Transform components must be finite and scale must be nonnegative."
            )
        }
        let rotation = simd_quatd(
            ix: Double(transform.rotation.imag.x),
            iy: Double(transform.rotation.imag.y),
            iz: Double(transform.rotation.imag.z),
            r: Double(transform.rotation.real)
        )
        return try EntityMotionPose(
            position: position,
            rotation: decomposeEulerZYX(rotation),
            scale: scale
        )
    }

    /// Checks whether a sparse update contains at least one scalar axis.
    private static func containsScalar(_ update: EntityMotionTransformPayload) -> Bool {
        let vectors = [update.position, update.rotation, update.scale]
        return vectors.contains {
            $0?.x != nil || $0?.y != nil || $0?.z != nil
        }
    }

    /// Decomposes a finite affine matrix without shear, reflection, or zero scale.
    static func decomposeAffine(_ matrix: simd_double4x4) throws -> EntityMotionPose {
        guard matrixIsFinite(matrix),
              abs(matrix.columns.0.w) <= 1e-10,
              abs(matrix.columns.1.w) <= 1e-10,
              abs(matrix.columns.2.w) <= 1e-10,
              abs(matrix.columns.3.w - 1) <= 1e-10
        else {
            throw EntityMotionCompilationError.unrepresentableTransform(
                "Matrix is not a finite affine transform."
            )
        }

        let axes = [
            SIMD3<Double>(matrix.columns.0.x, matrix.columns.0.y, matrix.columns.0.z),
            SIMD3<Double>(matrix.columns.1.x, matrix.columns.1.y, matrix.columns.1.z),
            SIMD3<Double>(matrix.columns.2.x, matrix.columns.2.y, matrix.columns.2.z),
        ]
        let scale = SIMD3<Double>(
            simd_length(axes[0]),
            simd_length(axes[1]),
            simd_length(axes[2])
        )
        guard scale.x > 0, scale.y > 0, scale.z > 0 else {
            throw EntityMotionCompilationError.unrepresentableTransform(
                "Matrix contains zero scale."
            )
        }

        let normalized = [
            axes[0] / scale.x,
            axes[1] / scale.y,
            axes[2] / scale.z,
        ]
        // RealityKit stores Transform matrices as Float, so valid rotated
        // non-uniform scales accumulate small orthogonality roundoff.
        let orthogonalityTolerance = 1e-5
        guard abs(simd_dot(normalized[0], normalized[1])) <= orthogonalityTolerance,
              abs(simd_dot(normalized[0], normalized[2])) <= orthogonalityTolerance,
              abs(simd_dot(normalized[1], normalized[2])) <= orthogonalityTolerance
        else {
            throw EntityMotionCompilationError.unrepresentableTransform(
                "Matrix contains shear."
            )
        }

        let rotationMatrix = simd_double3x3(
            normalized[0],
            normalized[1],
            normalized[2]
        )
        guard simd_determinant(rotationMatrix) > 0 else {
            throw EntityMotionCompilationError.unrepresentableTransform(
                "Matrix contains a reflected basis."
            )
        }

        return try .init(
            position: .init(
                matrix.columns.3.x,
                matrix.columns.3.y,
                matrix.columns.3.z
            ),
            rotation: decomposeEulerZYX(simd_quatd(rotationMatrix)),
            scale: scale
        )
    }

    /// Applies optional finite components to one baseline vector.
    private static func merge(
        _ update: EntityMotionVector3Payload?,
        onto baseline: SIMD3<Double>,
        requiresNonnegativeValue: Bool
    ) throws -> SIMD3<Double> {
        let result = SIMD3<Double>(
            update?.x ?? baseline.x,
            update?.y ?? baseline.y,
            update?.z ?? baseline.z
        )
        guard result.x.isFinite, result.y.isFinite, result.z.isFinite,
              !requiresNonnegativeValue
              || (result.x >= 0 && result.y >= 0 && result.z >= 0)
        else {
            throw EntityMotionCompilationError.invalidSetValues(
                "Set values must be finite and scale must be nonnegative."
            )
        }
        return result
    }

    /// Normalizes degrees to `(-180, 180]`, including canonical positive 180.
    private static func canonicalDegrees(_ degrees: Double) -> Double {
        var normalized = degrees.truncatingRemainder(dividingBy: 360)
        if normalized <= -180 || abs(normalized + 180) < 1e-10 {
            normalized += 360
        } else if normalized > 180 {
            normalized -= 360
        }
        return abs(normalized) < 1e-12 ? 0 : normalized
    }

    /// Checks every matrix component without allocating an intermediate payload.
    private static func matrixIsFinite(_ matrix: simd_double4x4) -> Bool {
        let columns = [
            matrix.columns.0,
            matrix.columns.1,
            matrix.columns.2,
            matrix.columns.3,
        ]
        return columns.allSatisfy {
            $0.x.isFinite && $0.y.isFinite && $0.z.isFinite && $0.w.isFinite
        }
    }
}
