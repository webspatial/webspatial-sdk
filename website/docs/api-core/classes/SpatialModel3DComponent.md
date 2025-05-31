# Class: SpatialModel3DComponent

Defined in: [component/SpatialModel3DComponent.ts:21](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L21)

Used to position a model3d in 3D space

## Extends

- `EventSpatialComponent`

## Constructors

### Constructor

> **new SpatialModel3DComponent**(`_resource`): `SpatialModel3DComponent`

Defined in: [component/EventSpatialComponent.ts:15](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/EventSpatialComponent.ts#L15)

#### Parameters

##### \_resource

`WebSpatialResource`

#### Returns

`SpatialModel3DComponent`

#### Inherited from

`EventSpatialComponent.constructor`

## Properties

### name

> **name**: `string` = `''`

Defined in: [SpatialObject.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L23)

#### Inherited from

`EventSpatialComponent.name`

***

### onFailure()?

> `optional` **onFailure**: (`errorReason`) => `void`

Defined in: [component/SpatialModel3DComponent.ts:131](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L131)

Callback fired when model load failure

#### Parameters

##### errorReason

`string`

#### Returns

`void`

***

### onSuccess()?

> `optional` **onSuccess**: () => `void`

Defined in: [component/SpatialModel3DComponent.ts:125](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L125)

Callback fired when model load success

#### Returns

`void`

## Accessors

### onDoubleTap

#### Set Signature

> **set** **onDoubleTap**(`callback`): `void`

Defined in: [component/SpatialModel3DComponent.ts:204](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L204)

##### Parameters

###### callback

`undefined` | () => `void`

##### Returns

`void`

***

### onDrag

#### Set Signature

> **set** **onDrag**(`callback`): `void`

Defined in: [component/SpatialModel3DComponent.ts:154](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L154)

##### Parameters

###### callback

`undefined` | (`dragEvent`) => `void`

##### Returns

`void`

***

### onDragEnd

#### Set Signature

> **set** **onDragEnd**(`callback`): `void`

Defined in: [component/SpatialModel3DComponent.ts:170](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L170)

##### Parameters

###### callback

`undefined` | (`dragEvent`) => `void`

##### Returns

`void`

***

### onDragStart

#### Set Signature

> **set** **onDragStart**(`callback`): `void`

Defined in: [component/SpatialModel3DComponent.ts:138](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L138)

##### Parameters

###### callback

`undefined` | (`dragEvent`) => `void`

##### Returns

`void`

***

### onLongPress

#### Set Signature

> **set** **onLongPress**(`callback`): `void`

Defined in: [component/SpatialModel3DComponent.ts:215](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L215)

##### Parameters

###### callback

`undefined` | () => `void`

##### Returns

`void`

***

### onTap

#### Set Signature

> **set** **onTap**(`callback`): `void`

Defined in: [component/SpatialModel3DComponent.ts:193](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L193)

##### Parameters

###### callback

`undefined` | () => `void`

##### Returns

`void`

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:18](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L18)

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`EventSpatialComponent.destroy`

***

### getEntity()

> **getEntity**(): `Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

Defined in: [component/SpatialComponent.ts:11](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialComponent.ts#L11)

Gets the entity this component is attached to

#### Returns

`Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

entity or null

#### Inherited from

`EventSpatialComponent.getEntity`

***

### onDestroy()

> `protected` **onDestroy**(): `Promise`\<`void`\>

Defined in: [component/EventSpatialComponent.ts:29](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/EventSpatialComponent.ts#L29)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`EventSpatialComponent.onDestroy`

***

### onRecvEvent()

> `protected` **onRecvEvent**(`data`): `void`

Defined in: [component/SpatialModel3DComponent.ts:22](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L22)

#### Parameters

##### data

`any`

The data associated with the received event.

#### Returns

`void`

#### Description

Abstract method to be implemented by subclasses. Called when a spatial event is received.

#### Overrides

`EventSpatialComponent.onRecvEvent`

***

### setAspectRatio()

> **setAspectRatio**(`aspectRatio`): `Promise`\<`void`\>

Defined in: [component/SpatialModel3DComponent.ts:96](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L96)

Constrains this model dimensions to the specified aspect ratio.
with a value of 0, the model will use the original aspect ratio.

#### Parameters

##### aspectRatio

`number`

number

#### Returns

`Promise`\<`void`\>

***

### setContentMode()

> **setContentMode**(`contentMode`): `Promise`\<`void`\>

Defined in: [component/SpatialModel3DComponent.ts:84](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L84)

Sets how the model fill the rect

#### Parameters

##### contentMode

`"fill"` | `"fit"`

#### Returns

`Promise`\<`void`\>

***

### setOpacity()

> **setOpacity**(`opacity`): `Promise`\<`void`\>

Defined in: [component/SpatialModel3DComponent.ts:74](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L74)

Sets the opacity of the model

#### Parameters

##### opacity

`number`

#### Returns

`Promise`\<`void`\>

***

### setResizable()

> **setResizable**(`resizable`): `Promise`\<`void`\>

Defined in: [component/SpatialModel3DComponent.ts:116](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L116)

Sets whether the model appear in original size or fit the rect

#### Parameters

##### resizable

`boolean`

#### Returns

`Promise`\<`void`\>

***

### setResolution()

> **setResolution**(`width`, `height`): `Promise`\<`void`\>

Defined in: [component/SpatialModel3DComponent.ts:58](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L58)

Sets the resolution of the spatial view in dom pixels

#### Parameters

##### width

`number`

##### height

`number`

#### Returns

`Promise`\<`void`\>

***

### setRotationAnchor()

> **setRotationAnchor**(`rotationAnchor`): `Promise`\<`void`\>

Defined in: [component/SpatialModel3DComponent.ts:64](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L64)

#### Parameters

##### rotationAnchor

[`Vec3`](Vec3.md)

#### Returns

`Promise`\<`void`\>

***

### setScrollWithParent()

> **setScrollWithParent**(`scrollWithParent`): `Promise`\<`void`\>

Defined in: [component/SpatialModel3DComponent.ts:106](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialModel3DComponent.ts#L106)

Defaults to false. If set to true, scrolling the parent page will also scroll this window with it like other dom elements

#### Parameters

##### scrollWithParent

`boolean`

value to set

#### Returns

`Promise`\<`void`\>
