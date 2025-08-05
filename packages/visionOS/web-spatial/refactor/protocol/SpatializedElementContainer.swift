protocol SpatializedElementContainer {
    var id: String { get }
    func addChild(_ spatializedElement: SpatializedElement)
    func removeChild(_ spatializedElement: SpatializedElement)
    func getChildren() -> [String: SpatializedElement]
    func getChildrenOfType(_ type: SpatializedElementType) -> [String: SpatializedElement]
}
