# Class: SpatialModelComponent

Defined in: [component/SpatialModelComponent.ts:9](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModelComponent.ts#L9)

Used to position a model in 3D space, made up of a mesh and materials to be applied to the mesh

## Extends

- `SpatialComponent`

## Properties

### name

> **name**: `string` = `''`

Defined in: [SpatialObject.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L23)

#### Inherited from

`SpatialComponent.name`

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:18](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L18)

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialComponent.destroy`

***

### getEntity()

> **getEntity**(): `Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

Defined in: [component/SpatialComponent.ts:11](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialComponent.ts#L11)

Gets the entity this component is attached to

#### Returns

`Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

entity or null

#### Inherited from

`SpatialComponent.getEntity`

***

### onDestroy()

> `protected` **onDestroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:25](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L25)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialComponent.onDestroy`

***

### setMaterials()

> **setMaterials**(`materials`): `Promise`\<`void`\>

Defined in: [component/SpatialModelComponent.ts:25](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModelComponent.ts#L25)

Sets the materials that should be applied to the mesh

#### Parameters

##### materials

[`SpatialPhysicallyBasedMaterialResource`](SpatialPhysicallyBasedMaterialResource.md)[]

array of materials to set

#### Returns

`Promise`\<`void`\>

***

### setMesh()

> **setMesh**(`mesh`): `Promise`\<`void`\>

Defined in: [component/SpatialModelComponent.ts:15](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModelComponent.ts#L15)

Sets the mesh to be displayed by the component

#### Parameters

##### mesh

[`SpatialMeshResource`](SpatialMeshResource.md)

mesh to set

#### Returns

`Promise`\<`void`\>
