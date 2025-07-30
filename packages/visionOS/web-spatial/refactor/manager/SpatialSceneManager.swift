class SpatialSceneManager {
    static let Instance: SpatialSceneManager = .init()
    private var map = [String: SpatialScene]()

    func create(_ url: String, _ style: String) -> SpatialScene {
        let scene = SpatialScene(url, style)
        map[scene.id] = scene
        return scene
    }

    func getScene(_ id: String) -> SpatialScene? {
        return map[id]
    }
}
