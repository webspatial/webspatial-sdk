---
"@webspatial/core-sdk": minor
"@webspatial/react-sdk": minor
---

Dynamic entity tree updates: recreateKey for entity teardown/recreate, GeometryEntity dynamic geometry and materials (removeComponent + addComponent), ModelEntity materials and setMaterials, UnlitMaterial dynamic color/opacity/transparent (updateProperties). Core adds RemoveComponentFromEntityCommand, SetMaterialsOnEntityCommand, SpatialEntity.removeComponent, SpatialModelEntity.setMaterials. React applies transform before adding entity to scene to avoid one-frame scale flash.
