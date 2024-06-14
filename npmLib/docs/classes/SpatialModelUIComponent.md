[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialModelUIComponent

# Class: SpatialModelUIComponent

Used to position a model in 3D space inline to the webpage (Maps to Model3D)

## Extends

- [`SpatialResource`](SpatialResource.md)

## Constructors

### new SpatialModelUIComponent()

> **new SpatialModelUIComponent**(`_resource`): [`SpatialModelUIComponent`](SpatialModelUIComponent.md)

#### Parameters

• **\_resource**: `WebSpatialResource`

#### Returns

[`SpatialModelUIComponent`](SpatialModelUIComponent.md)

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`constructor`](SpatialResource.md#constructors)

#### Source

index.ts:59

## Properties

### \_resource

> **\_resource**: `WebSpatialResource`

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`_resource`](SpatialResource.md#_resource)

#### Source

index.ts:59

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`destroy`](SpatialResource.md#destroy)

#### Source

index.ts:61

***

### setAspectRatio()

> **setAspectRatio**(`aspectRatio`): `Promise`\<`void`\>

#### Parameters

• **aspectRatio**: `string`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:101

***

### setResolution()

> **setResolution**(`x`, `y`): `Promise`\<`void`\>

#### Parameters

• **x**: `number`

• **y**: `number`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:104

***

### setURL()

> **setURL**(`url`): `Promise`\<`void`\>

#### Parameters

• **url**: `string`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:98
