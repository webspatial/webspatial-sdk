import RealityKit
import SwiftUI

/// Radians of rotation applied per point of drag translation. Tuned so a
/// ~360pt swipe produces roughly a full turn.
private let orbitDragSensitivity: Double = .pi / 360

/// Soft pitch limit. The visible pitch tapers towards this via a rubber-band
/// curve so the user can drag past, but the model never approaches upside-down.
private let orbitMaxPitch: Double = .pi / 3

/// Drag-to-orbit interaction for `stagemode="orbit"` models.
///
/// A horizontal drag yaws around world Y and a vertical drag pitches around
/// world X (with elastic clamping). Yaw accumulates across drags; pitch springs
/// back to neutral on release. The composed rotation is written onto the base
/// pose captured at the first drag, so the JS-supplied `entityTransform` (its
/// translation and scale) is preserved.
struct OrbitInteraction: ViewModifier {
    let element: SpatializedStatic3DElement
    let scene: SpatialScene

    /// Pose captured at the first drag; orbit rotation composes on top of it.
    @State private var base: AffineTransform3D = .identity
    @State private var yaw = 0.0
    @State private var pitch = 0.0
    @State private var dragStartYaw = 0.0
    @State private var isDragging = false
    @State private var captured = false

    func body(content: Content) -> some View {
        content
            .hoverEffect()
            .gesture(dragGesture)
    }

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                if !isDragging {
                    if !captured {
                        base = element.entityTransform
                        captured = true
                    }
                    dragStartYaw = yaw
                    isDragging = true
                }
                yaw = dragStartYaw + Double(value.translation.width) * orbitDragSensitivity
                pitch = elasticClamp(
                    -Double(value.translation.height) * orbitDragSensitivity,
                    limit: orbitMaxPitch
                )
                apply()
            }
            .onEnded { _ in
                isDragging = false
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    pitch = 0
                    apply()
                }
            }
    }

    private func apply() {
        // Apply base → yaw → pitch so the user always rotates around world axes.
        let rotation = AffineTransform3D(rotation: Rotation3D(angle: .radians(pitch), axis: .x))
            .concatenating(AffineTransform3D(rotation: Rotation3D(angle: .radians(yaw), axis: .y)))
        let effective = rotation.concatenating(base)
        element.entityTransform = effective
        scene.sendWebMsg(
            element.id,
            EntityTransformChangeEvent(detail: EntityTransformChangeDetail(transform: effective.columnMajorArray))
        )
    }

    /// Rubber-band curve mapping the unbounded raw drag pitch into a bounded
    /// effective angle. Linear near zero, asymptotic near `limit`, so dragging
    /// further yields ever-smaller motion.
    private func elasticClamp(_ value: Double, limit: Double) -> Double {
        limit * tanh(value / limit)
    }
}

extension View {
    /// Attaches orbit drag interaction when `enabled`, otherwise leaves the view
    /// untouched.
    @ViewBuilder
    func orbitInteraction(
        _ enabled: Bool,
        element: SpatializedStatic3DElement,
        scene: SpatialScene
    ) -> some View {
        if enabled {
            modifier(OrbitInteraction(element: element, scene: scene))
        } else {
            self
        }
    }
}

private extension AffineTransform3D {
    /// Column-major 16-element flattening matching the format JS uses when
    /// sending the matrix into native via
    /// `UpdateSpatializedStatic3DElementProperties`. `AffineTransform3D.matrix`
    /// only stores the upper 3 rows; the implicit `[0, 0, 0, 1]` bottom row
    /// is re-introduced here.
    var columnMajorArray: [Double] {
        let c = matrix.columns
        return [
            c.0.x, c.0.y, c.0.z, 0,
            c.1.x, c.1.y, c.1.z, 0,
            c.2.x, c.2.y, c.2.z, 0,
            c.3.x, c.3.y, c.3.z, 1,
        ]
    }
}
