[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialIFrameComponent

# Class: SpatialIFrameComponent

Used to position an iframe in 3D space

## Extends

- [`SpatialResource`](SpatialResource.md)

## Constructors

### new SpatialIFrameComponent()

> **new SpatialIFrameComponent**(`_resource`): [`SpatialIFrameComponent`](SpatialIFrameComponent.md)

#### Parameters

• **\_resource**: `WebSpatialResource`

#### Returns

[`SpatialIFrameComponent`](SpatialIFrameComponent.md)

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

### loadURL()

> **loadURL**(`url`): `Promise`\<`void`\>

#### Parameters

• **url**: `string`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:70

***

### setResolution()

> **setResolution**(`x`, `y`): `Promise`\<`void`\>

#### Parameters

• **x**: `number`

• **y**: `number`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:73

***

### setStyle()

> **setStyle**(`options`): `Promise`\<`void`\>

#### Parameters

• **options**: `any`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:77
