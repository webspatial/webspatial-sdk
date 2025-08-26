class VolumeSpatialScene: SpatialScene {
    private var _backgroundMaterial = BackgroundMaterial.None
    override var backgroundMaterial: BackgroundMaterial {
        get {
            if _backgroundMaterial == .None { return .Transparent }
            return _backgroundMaterial
        }
        set(newValue) {
            _backgroundMaterial = newValue
            spatialWebViewModel.setBackgroundTransparent(_backgroundMaterial != .None)
        }
    }
}
