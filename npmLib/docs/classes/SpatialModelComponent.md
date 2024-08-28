[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialModelComponent

# Class: SpatialModelComponent

Used to position a model in 3D space, made up of a mesh and materials to be applied to the mesh

## Extends

- [`SpatialComponent`](SpatialComponent.md)

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`SpatialComponent`](SpatialComponent.md).[`destroy`](SpatialComponent.md#destroy)

#### Defined in

SpatialResource.ts:15

***

### setMaterials()

> **setMaterials**(`materials`): `Promise`\<`void`\>

Sets the materials that should be applied to the mesh

#### Parameters

• **materials**: [`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)[]

array of materials to set

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelComponent.ts:23

***

### setMesh()

> **setMesh**(`mesh`): `Promise`\<`void`\>

Sets the mesh to be displayed by the component

#### Parameters

• **mesh**: [`SpatialMeshResource`](SpatialMeshResource.md)

mesh to set

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelComponent.ts:15
