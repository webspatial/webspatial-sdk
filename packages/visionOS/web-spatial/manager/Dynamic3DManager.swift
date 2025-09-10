import RealityKit
import Foundation

class Dynamic3DManager{
    static func createEntity(_ props: CreateSpatialEntity) -> SpatialEntity{
        let entity = SpatialEntity()
        entity.name = props.name ?? ""
        return entity
    }
    
    static func createModelComponent(mesh:Geometry, mats:[SpatialMaterial]) -> SpatialModelComponent{
        return SpatialModelComponent(mesh: mesh, mats: mats)
    }
    
    static func createGeometry(_ props: CreateGeometryProperties) -> Geometry?{
        guard let geometry = switch GeometryType(rawValue: props.type) {
        case .BoxGeometry:
            BoxGeometry(width: props.width!, height: props.height!, depth: props.depth!, cornerRadius: props.cornerRadius ?? 0, splitFaces: props.splitFaces ?? false)
        default:
            nil
        } else {
            return nil
        }
        return geometry
    }
    
    static func createUnlitMaterial(_ props: CreateUnlitMaterial, _ tex:TextureResource? = nil) -> SpatialUnlitMaterial{
        return SpatialUnlitMaterial(props.color ?? "#FFFFFF", tex, props.transparent ?? true, props.opacity ?? 1)
    }
    
    func createTexture(){
        
    }
    
    static func createModelAsset(_ url:String){
        
    }
    
    func getEntity(){
        
    }
    
    func getComponent(){
        
    }
    
    func getGeometry(){
        
    }
    
    func getMaterial(){
        
    }
    
    func getTexture(){
        
    }
    
    func getModelAsset(){
        
    }
    
    func destroy(){
        
    }
    
    private func destroyEntity(){
        
    }
    
    private func destroyComponent(){
        
    }
    
    private func destroyGeometry(){
        
    }
    
    private func destroyMaterial(){
        
    }
    
    private func destroyTexture(){
        
    }
    
    private func destroysModelAsset(){
        
    }
}
