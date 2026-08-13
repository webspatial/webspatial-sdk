import SwiftUI

private let degreesPerPoint = 0.5
private let pitchLimitDegrees = 100.0
private let springBack = Animation.spring(response: 0.45, dampingFraction: 0.7)

/// Adds an orbital camera-style rotation gesture to a 3D model.
///
/// Both horizontal yaw (around the Y-axis) and vertical pitch (around the
/// X-axis, clamped to ±100° so the model can't flip past upright) are folded
/// directly into the bound `entityTransform` on each drag tick, so the web
/// layer always observes an accurate transform. On release, the pitch
/// elastically springs back to 0: the data is set to the unpitched final state
/// immediately while SwiftUI animates the existing `.rotation3DEffect` from the
/// old (pitched) rotation to the new (unpitched) rotation for a smooth visual.
struct OrbitModifier: ViewModifier {
    let enabled: Bool
    @Binding var entityTransform: AffineTransform3D
    let onChange: (AffineTransform3D) -> Void

    @State private var dragStartTransform: AffineTransform3D?
    @State private var dragYawDegrees: Double = 0

    func body(content: Content) -> some View {
        content
            .simultaneousGesture(enabled ? orbitGesture : nil)
            .onChange(of: enabled) { _, isEnabled in
                if !isEnabled { releaseElastic() }
            }
    }

    private var orbitGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                let base = dragStartTransform ?? entityTransform
                if dragStartTransform == nil { dragStartTransform = base }

                dragYawDegrees = Double(value.translation.width) * degreesPerPoint
                let pitchTarget = Double(-value.translation.height) * degreesPerPoint
                let pitchDegrees = max(-pitchLimitDegrees, min(pitchLimitDegrees, pitchTarget))

                let new = compose(base: base, yawDegrees: dragYawDegrees, pitchDegrees: pitchDegrees)
                entityTransform = new
                onChange(new)
            }
            .onEnded { _ in releaseElastic() }
    }

    private func releaseElastic() {
        guard let base = dragStartTransform else { return }
        let unpitched = compose(base: base, yawDegrees: dragYawDegrees, pitchDegrees: 0)
        withAnimation(springBack) { entityTransform = unpitched }
        onChange(unpitched)
        dragStartTransform = nil
        dragYawDegrees = 0
    }

    private func compose(
        base: AffineTransform3D,
        yawDegrees: Double,
        pitchDegrees: Double
    ) -> AffineTransform3D {
        let translation = AffineTransform3D(translation: base.translation)
        let yaw = AffineTransform3D(rotation: Rotation3D(angle: .degrees(yawDegrees), axis: .y))
        let pitch = AffineTransform3D(rotation: Rotation3D(angle: .degrees(pitchDegrees), axis: .x))
        let baseRotation = AffineTransform3D(rotation: base.rotation ?? .identity)
        let scale = AffineTransform3D(scale: base.scale)
        return translation
            .concatenating(yaw)
            .concatenating(pitch)
            .concatenating(baseRotation)
            .concatenating(scale)
    }
}

extension View {
    func orbit(
        enabled: Bool,
        entityTransform: Binding<AffineTransform3D>,
        onChange: @escaping (AffineTransform3D) -> Void
    ) -> some View {
        modifier(OrbitModifier(enabled: enabled, entityTransform: entityTransform, onChange: onChange))
    }
}
