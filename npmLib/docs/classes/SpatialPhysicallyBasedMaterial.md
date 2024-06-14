[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialPhysicallyBasedMaterial

# Class: SpatialPhysicallyBasedMaterial

PBR material which can be set on a SpatialModelComponent

## Extends

- [`SpatialResource`](SpatialResource.md)

## Constructors

### new SpatialPhysicallyBasedMaterial()

> **new SpatialPhysicallyBasedMaterial**(`_resource`): [`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)

#### Parameters

• **\_resource**: `WebSpatialResource`

#### Returns

[`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)

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

***

### baseColor

> **baseColor**: `object`

#### a

> **a**: `number` = `1.0`

#### b

> **b**: `number` = `0.7`

#### g

> **g**: `number` = `0.7`

#### r

> **r**: `number` = `0.0`

#### Source

index.ts:116

***

### metallic

> **metallic**: `object`

#### value

> **value**: `number` = `0.5`

#### Source

index.ts:117

***

### roughness

> **roughness**: `object`

#### value

> **value**: `number` = `0.5`

#### Source

index.ts:118

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

### update()

> **update**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:120
