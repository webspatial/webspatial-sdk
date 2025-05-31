import {SidebarsConfig} from '@docusaurus/plugin-content-docs';
const typedocSidebar: SidebarsConfig = {
  items: [
    {
      type: 'category',
      label: 'Classes',
      items: [
        {
          type: 'doc',
          id: 'api-core/classes/Spatial',
          label: 'Spatial',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialEntity',
          label: 'SpatialEntity',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialHelper',
          label: 'SpatialHelper',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialInputComponent',
          label: 'SpatialInputComponent',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialMeshResource',
          label: 'SpatialMeshResource',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialModel3DComponent',
          label: 'SpatialModel3DComponent',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialModelComponent',
          label: 'SpatialModelComponent',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialPhysicallyBasedMaterialResource',
          label: 'SpatialPhysicallyBasedMaterialResource',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialSession',
          label: 'SpatialSession',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialTransform',
          label: 'SpatialTransform',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialViewComponent',
          label: 'SpatialViewComponent',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialWindowComponent',
          label: 'SpatialWindowComponent',
        },
        {
          type: 'doc',
          id: 'api-core/classes/SpatialWindowContainer',
          label: 'SpatialWindowContainer',
        },
        {
          type: 'doc',
          id: 'api-core/classes/Vec3',
          label: 'Vec3',
        },
        {
          type: 'doc',
          id: 'api-core/classes/Vec4',
          label: 'Vec4',
        },
      ],
    },
    {
      type: 'category',
      label: 'Interfaces',
      items: [
        {
          type: 'doc',
          id: 'api-core/interfaces/sceneDataJSBShape',
          label: 'sceneDataJSBShape',
        },
        {
          type: 'doc',
          id: 'api-core/interfaces/sceneDataShape',
          label: 'sceneDataShape',
        },
        {
          type: 'doc',
          id: 'api-core/interfaces/WindowContainerOptions',
          label: 'WindowContainerOptions',
        },
      ],
    },
    {
      type: 'category',
      label: 'Type Aliases',
      items: [
        {
          type: 'doc',
          id: 'api-core/type-aliases/BackgroundMaterialType',
          label: 'BackgroundMaterialType',
        },
        {
          type: 'doc',
          id: 'api-core/type-aliases/CornerRadius',
          label: 'CornerRadius',
        },
        {
          type: 'doc',
          id: 'api-core/type-aliases/LoadingMethodKind',
          label: 'LoadingMethodKind',
        },
        {
          type: 'doc',
          id: 'api-core/type-aliases/SpatialModelDragEvent',
          label: 'SpatialModelDragEvent',
        },
        {
          type: 'doc',
          id: 'api-core/type-aliases/StyleParam',
          label: 'StyleParam',
        },
        {
          type: 'doc',
          id: 'api-core/type-aliases/WindowStyle',
          label: 'WindowStyle',
        },
      ],
    },
  ],
};
export default typedocSidebar;
