class UpdateSpatialSceneMaterialCommand: CommandDataProtocol {
    static let commandType: String = "updateSpatialSceneMaterial"
    let material: BackgroundMaterial
}

class UpdateSpatialSceneCorer: CommandDataProtocol {
    static let commandType: String = "updateSpatialSceneCorner"
    let cornerRadius: CornerRadius
}
