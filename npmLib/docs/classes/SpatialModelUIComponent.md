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

<<<<<<< HEAD
• **animationBuilder**: [`AnimationBuilder`](AnimationBuilder.md)
=======
• **animationBuilder**: `AnimationBuilder`
>>>>>>> main

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
component/SpatialModelUIComponent.ts:54
=======
SpatialResource/SpatialModelUIComponent.ts:29
>>>>>>> main

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

<<<<<<< HEAD
component/SpatialModelUIComponent.ts:42
=======
SpatialResource/SpatialModelUIComponent.ts:17
>>>>>>> main

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

<<<<<<< HEAD
component/SpatialModelUIComponent.ts:50
=======
SpatialResource/SpatialModelUIComponent.ts:25
>>>>>>> main

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

<<<<<<< HEAD
component/SpatialModelUIComponent.ts:39
=======
SpatialResource/SpatialModelUIComponent.ts:14
>>>>>>> main
