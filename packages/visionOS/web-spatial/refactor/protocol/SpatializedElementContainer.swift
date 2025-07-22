protocol SpatializedElementContainer {
    var id: String { get }
    func addChild(_ spatializedElement: SpatializedElement)
    func removeChild(_ spatializedElement: SpatializedElement)
    func getChildrenOfType(_ type: SpatializedElementType) -> [String: SpatializedElement]
}
