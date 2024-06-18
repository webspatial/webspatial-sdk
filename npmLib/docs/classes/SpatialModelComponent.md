[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialModelComponent

# Class: SpatialModelComponent

Used to position a model in 3D space

## Extends

- [`SpatialResource`](SpatialResource.md)

## Constructors

### new SpatialModelComponent()

> **new SpatialModelComponent**(`_resource`): [`SpatialModelComponent`](SpatialModelComponent.md)

#### Parameters

• **\_resource**: `WebSpatialResource`

#### Returns

[`SpatialModelComponent`](SpatialModelComponent.md)

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`constructor`](SpatialResource.md#constructors)

#### Source

index.ts:76

## Properties

### \_resource

> **\_resource**: `WebSpatialResource`

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`_resource`](SpatialResource.md#_resource)

#### Source

index.ts:76

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`destroy`](SpatialResource.md#destroy)

#### Source

index.ts:78

***

### setMaterials()

> **setMaterials**(`materials`): `Promise`\<`void`\>

#### Parameters

• **materials**: [`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)[]

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:106

***

### setMesh()

> **setMesh**(`mesh`): `Promise`\<`void`\>

#### Parameters

• **mesh**: [`SpatialMeshResource`](SpatialMeshResource.md)

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:103
