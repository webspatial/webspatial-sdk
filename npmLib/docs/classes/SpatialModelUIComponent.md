[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialModelUIComponent

# Class: SpatialModelUIComponent

Used to position a model in 3D space inline to the webpage (Maps to Model3D tag)
Positioning behaves the same as a spatial window marked as dom space

## Extends

- [`SpatialResource`](SpatialResource.md)

## Methods

### applyAnimationToResource()

> **applyAnimationToResource**(`animationBuilder`): `Promise`\<`void`\>

#### Parameters

• **animationBuilder**: `AnimationBuilder`

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialResource/SpatialModelUIComponent.ts:29

***

### destroy()

> **destroy**(): `Promise`\<`void`\>

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`destroy`](SpatialResource.md#destroy)

#### Defined in

SpatialResource/SpatialResource.ts:15

***

### setAspectRatio()

> **setAspectRatio**(`aspectRatio`): `Promise`\<`void`\>

#### Parameters

• **aspectRatio**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialResource/SpatialModelUIComponent.ts:17

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

SpatialResource/SpatialModelUIComponent.ts:25

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

SpatialResource/SpatialModelUIComponent.ts:14
