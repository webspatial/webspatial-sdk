protocol SpatializedElementContainer {
    var id: String { get }
    var parent: ScrollAbleSpatialElementContainer? { get }
    func addChild(_ spatializedElement: SpatializedElement)
    func removeChild(_ spatializedElement: SpatializedElement)
    func getChildren() -> [String: SpatializedElement]
    func getChildren<T: SpatializedElement>(ofType type: T.Type) -> [T]
}
