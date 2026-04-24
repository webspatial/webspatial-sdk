const typesFile = 'packages/react/src/spatialized-container/types.ts'

export const componentDocgenConfig = {
  outputFile: 'docs/generated/react-components.json',
  components: [
    {
      name: 'Model',
      sourceFile: 'packages/react/src/Model.tsx',
      propsType: 'ModelProps',
      refType: 'ModelRef',
    },
    {
      name: 'SpatializedContainer',
      sourceFile:
        'packages/react/src/spatialized-container/SpatializedContainer.tsx',
      propsSourceFile: typesFile,
      propsType: 'SpatializedContainerProps',
    },
    {
      name: 'Spatialized2DElementContainer',
      sourceFile:
        'packages/react/src/spatialized-container/Spatialized2DElementContainer.tsx',
      propsSourceFile: typesFile,
      propsType: 'Spatialized2DElementContainerProps',
    },
    {
      name: 'SpatializedStatic3DElementContainer',
      sourceFile:
        'packages/react/src/spatialized-container/SpatializedStatic3DElementContainer.tsx',
      propsSourceFile: typesFile,
      propsType: 'SpatializedStatic3DContainerProps',
    },
    {
      name: 'Reality',
      sourceFile: 'packages/react/src/reality/components/Reality.tsx',
      propsType: 'RealityProps',
    },
    {
      name: 'SceneGraph',
      sourceFile: 'packages/react/src/reality/components/SceneGraph.tsx',
      propsType: 'SceneGraphProps',
    },
    {
      name: 'Entity',
      sourceFile: 'packages/react/src/reality/components/Entity.tsx',
      propsType: 'EntityComponentProps',
    },
    {
      name: 'GeometryEntity',
      sourceFile: 'packages/react/src/reality/components/GeometryEntity.tsx',
      propsType: 'GeometryEntityProps',
    },
    {
      name: 'BoxEntity',
      sourceFile: 'packages/react/src/reality/components/BoxEntity.tsx',
      propsType: 'BoxEntityProps',
    },
    {
      name: 'SphereEntity',
      sourceFile: 'packages/react/src/reality/components/SphereEntity.tsx',
      propsType: 'SphereEntityProps',
    },
    {
      name: 'ConeEntity',
      sourceFile: 'packages/react/src/reality/components/ConeEntity.tsx',
      propsType: 'ConeEntityProps',
    },
    {
      name: 'CylinderEntity',
      sourceFile: 'packages/react/src/reality/components/CylinderEntity.tsx',
      propsType: 'CylinderEntityProps',
    },
    {
      name: 'PlaneEntity',
      sourceFile: 'packages/react/src/reality/components/PlaneEntity.tsx',
      propsType: 'PlaneEntityProps',
    },
    {
      name: 'ModelEntity',
      sourceFile: 'packages/react/src/reality/components/ModelEntity.tsx',
      propsType: 'ModelEntityProps',
    },
    {
      name: 'ModelAsset',
      sourceFile: 'packages/react/src/reality/components/ModelAsset.tsx',
      propsType: 'ModelAssetProps',
    },
    {
      name: 'AttachmentEntity',
      sourceFile: 'packages/react/src/reality/components/AttachmentEntity.tsx',
      propsType: 'AttachmentEntityProps',
    },
    {
      name: 'AttachmentAsset',
      sourceFile: 'packages/react/src/reality/components/AttachmentAsset.tsx',
      propsType: 'AttachmentAssetProps',
    },
    {
      name: 'UnlitMaterial',
      sourceFile: 'packages/react/src/reality/components/UnlitMaterial.tsx',
      propsType: 'UnlitMaterialProps',
    },
    {
      name: 'Material',
      sourceFile: 'packages/react/src/reality/components/Material.tsx',
      propsType: 'MaterialProps',
    },
    {
      name: 'SSRProvider',
      sourceFile: 'packages/react/src/ssr/SSRContext.tsx',
      propsType: 'SSRProviderProps',
    },
    {
      name: 'SpatialMonitor',
      sourceFile:
        'packages/react/src/spatialized-container-monitor/SpatialMonitor.tsx',
      propsType: 'SpatialMonitorProps',
    },
  ],
}
