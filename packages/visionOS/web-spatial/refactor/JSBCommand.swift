class UpdateSpatialSceneMaterialCommand: CommandDataProtocol {
    static let commandType: String = "updateSpatialSceneMaterial"
    let material: BackgroundMaterial
}
