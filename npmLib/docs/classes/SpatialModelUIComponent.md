[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialModelUIComponent

# Class: SpatialModelUIComponent

Used to position a model in 3D space inline to the webpage (Maps to Model3D tag)
Positioning behaves the same as a spatial window marked as dom space

## Extends

- [`SpatialComponent`](SpatialComponent.md)

## Methods

### applyAnimationToResource()

> **applyAnimationToResource**(`animationBuilder`): `Promise`\<`void`\>

#### Parameters

• **animationBuilder**: [`AnimationBuilder`](AnimationBuilder.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelUIComponent.ts:54

***

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

### setAspectRatio()

> **setAspectRatio**(`aspectRatio`): `Promise`\<`void`\>

#### Parameters

• **aspectRatio**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialModelUIComponent.ts:42

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
