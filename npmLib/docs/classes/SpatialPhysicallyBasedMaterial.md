[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialPhysicallyBasedMaterial

# Class: SpatialPhysicallyBasedMaterial

PBR material which can be set on a SpatialModelComponent

## Extends

- `SpatialObject`

## Properties

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

#### Defined in

resource/SpatialPhysicallyBasedMaterial.ts:8

***

### metallic

> **metallic**: `object`

#### value

> **value**: `number` = `0.5`

#### Defined in

resource/SpatialPhysicallyBasedMaterial.ts:9

***

### roughness

> **roughness**: `object`

#### value

> **value**: `number` = `0.5`

#### Defined in

resource/SpatialPhysicallyBasedMaterial.ts:10

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialObject.destroy`

#### Defined in

SpatialObject.ts:15

***

### update()

> **update**(): `Promise`\<`void`\>

Syncs state of color, metallic, roupghness to the renderer

#### Returns

`Promise`\<`void`\>

#### Defined in

resource/SpatialPhysicallyBasedMaterial.ts:15
