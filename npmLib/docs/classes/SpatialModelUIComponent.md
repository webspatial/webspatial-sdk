[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialModelUIComponent

# Class: SpatialModelUIComponent

Used to position a model in 3D space inline to the webpage (Maps to Model3D tag)
Positioning behaves the same as a spatial window marked as dom space

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

SpatialObject.ts:15

***

### getEntity()

> **getEntity**(): `Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

#### Returns

`Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

#### Inherited from

[`SpatialComponent`](SpatialComponent.md).[`getEntity`](SpatialComponent.md#getentity)

#### Defined in

component/SpatialComponent.ts:5

***

### setAspectRatio()

> **setAspectRatio**(`aspectRatio`): `Promise`\<`void`\>

#### Parameters

• **aspectRatio**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelUIComponent.ts:42

***

### setOpacity()

> **setOpacity**(`opacity`): `Promise`\<`void`\>

Sets the opacity of the model

#### Parameters

• **opacity**: `number`

model opacity

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelUIComponent.ts:58

***

### setResolution()

> **setResolution**(`x`, `y`): `Promise`\<`void`\>

Sets the resolution of the component to be displayed (behaves the same as inline window)

#### Parameters

• **x**: `number`

resolution in pixels

• **y**: `number`

resolution in pixels

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelUIComponent.ts:50

***

### setURL()

> **setURL**(`url`): `Promise`\<`void`\>

Sets the url of the model to load

#### Parameters

• **url**: `string`

url of the model to load

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelUIComponent.ts:39
