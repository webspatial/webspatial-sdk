import RealityKit
import Foundation

class Dynamic3DManager{
    private var entities:[String:SpatialEntity] = [:]
    private var components:[String:Component] = [:]
    private var materials:[String:Material] = [:]
    private var geometries:[String:MeshResource] = [:]
    private var textures:[String:TextureResource] = [:]
    private var modelAssets:[String:Entity] = [:]
    
    func createEntity(_ id:String, _ name:String = "") -> String{
        let entity = SpatialEntity()
        entity.name = name
        entities[entity.spatialId] = entity
        return entity.spatialId
    }
    
    func createComponent(){
        
    }
    
    func createGeometry(){
        
    }
    
    func createMaterial(){
        
    }
    
    func createTexture(){
        
    }
    
    func createModelAsset(){
        
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
