# Class: SpatialPhysicallyBasedMaterialResource

Defined in: [resource/SpatialPhysicallyBasedMaterialResource.ts:8](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/resource/SpatialPhysicallyBasedMaterialResource.ts#L8)

PBR material which can be set on a SpatialModelComponent

## Extends

- `SpatialObject`

## Properties

### \_modelComponentAttachedTo

> **\_modelComponentAttachedTo**: `object` = `{}`

Defined in: [resource/SpatialPhysicallyBasedMaterialResource.ts:22](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/resource/SpatialPhysicallyBasedMaterialResource.ts#L22)

#### Index Signature

\[`key`: `string`\]: [`SpatialModelComponent`](SpatialModelComponent.md)

***

### baseColor

> **baseColor**: `object`

Defined in: [resource/SpatialPhysicallyBasedMaterialResource.ts:12](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/resource/SpatialPhysicallyBasedMaterialResource.ts#L12)

Base color of the material containing rgba between 0 and 1

#### a

> **a**: `number` = `1.0`

#### b

> **b**: `number` = `0.7`

#### g

> **g**: `number` = `0.7`

#### r

> **r**: `number` = `0.0`

***

### metallic

> **metallic**: `object`

Defined in: [resource/SpatialPhysicallyBasedMaterialResource.ts:16](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/resource/SpatialPhysicallyBasedMaterialResource.ts#L16)

PBR metalic value between 0 and 1

#### value

> **value**: `number` = `0.5`

***

### name

> **name**: `string` = `''`

Defined in: [SpatialObject.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L23)

#### Inherited from

`SpatialObject.name`

***

### roughness

> **roughness**: `object`

Defined in: [resource/SpatialPhysicallyBasedMaterialResource.ts:20](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/resource/SpatialPhysicallyBasedMaterialResource.ts#L20)

PBR roughness value between 0 and 1

#### value

> **value**: `number` = `0.5`

## Methods

### \_addToComponent()

> **\_addToComponent**(`c`): `void`

Defined in: [resource/SpatialPhysicallyBasedMaterialResource.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/resource/SpatialPhysicallyBasedMaterialResource.ts#L23)

#### Parameters

##### c

[`SpatialModelComponent`](SpatialModelComponent.md)

#### Returns

`void`

***

### destroy()

> **destroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:18](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L18)

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialObject.destroy`

***

### onDestroy()

> `protected` **onDestroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:25](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L25)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialObject.onDestroy`

***

### update()

> **update**(): `Promise`\<`void`\>

Defined in: [resource/SpatialPhysicallyBasedMaterialResource.ts:30](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/resource/SpatialPhysicallyBasedMaterialResource.ts#L30)

Syncs state of color, metallic, roupghness to the renderer

#### Returns

`Promise`\<`void`\>
