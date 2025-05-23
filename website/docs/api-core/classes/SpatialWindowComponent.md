# Class: SpatialWindowComponent

Defined in: [component/SpatialWindowComponent.ts:45](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L45)

Used to position an web window in 3D space

## Extends

- `SpatialComponent`

## Properties

### name

> **name**: `string` = `''`

Defined in: [SpatialObject.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L23)

#### Inherited from

`SpatialComponent.name`

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:18](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L18)

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialComponent.destroy`

***

### getEntity()

> **getEntity**(): `Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

Defined in: [component/SpatialComponent.ts:11](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialComponent.ts#L11)

Gets the entity this component is attached to

#### Returns

`Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

entity or null

#### Inherited from

`SpatialComponent.getEntity`

***

### loadURL()

> **loadURL**(`url`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:50](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L50)

Loads a url page in the window

#### Parameters

##### url

`string`

url to load

#### Returns

`Promise`\<`void`\>

***

### onDestroy()

> `protected` **onDestroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:25](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L25)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialComponent.onDestroy`

***

### setFromWindow()

> **setFromWindow**(`window`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:54](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L54)

#### Parameters

##### window

`any`

#### Returns

`Promise`\<`void`\>

***

### setOpacity()

> **setOpacity**(`opacity`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:93](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L93)

[Experimental] Sets the opacity of the window after apply material

#### Parameters

##### opacity

`number`

#### Returns

`Promise`\<`void`\>

***

### setResolution()

> **setResolution**(`width`, `height`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:73](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L73)

Sets the resolution of the window, the resulting dimensions when rendered will be equal to 1/1360 units
eg. if the resolution is set to 1360x1360 it will be a 1x1 plane
See 1360 in spatialViewUI.swift for how this ratio works

#### Parameters

##### width

`number`

width in pixels

##### height

`number`

height in pixels

#### Returns

`Promise`\<`void`\>

***

### setRotationAnchor()

> **setRotationAnchor**(`rotationAnchor`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:83](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L83)

[Experimental] Sets the anchor which the entity this is attached to will rotate around

#### Parameters

##### rotationAnchor

[`Vec3`](Vec3.md)

#### Returns

`Promise`\<`void`\>

***

### setScrollEdgeInsets()

> **setScrollEdgeInsets**(`insets`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:149](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L149)

Modifies the amount the spatial window can be scrolled
Should only be used internally
See https://developer.apple.com/documentation/uikit/1624475-uiedgeinsetsmake?language=objc

#### Parameters

##### insets

margin to modify scroll distances by

###### bottom

`number`

###### left

`number`

###### right

`number`

###### top

`number`

#### Returns

`Promise`\<`void`\>

***

### setScrollEnabled()

> **setScrollEnabled**(`enabled`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:164](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L164)

Enable/Disable scrolling in the window (defaults to enabled), if disabled, scrolling will be applied to the root page

#### Parameters

##### enabled

`boolean`

value to set

#### Returns

`Promise`\<`void`\>

***

### setScrollWithParent()

> **setScrollWithParent**(`scrollWithParent`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:172](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L172)

Defaults to false. If set to true, scrolling the parent page will also scroll this window with it like other dom elements

#### Parameters

##### scrollWithParent

`boolean`

value to set

#### Returns

`Promise`\<`void`\>

***

### setStyle()

> **setStyle**(`styleParam`): `Promise`\<`void`\>

Defined in: [component/SpatialWindowComponent.ts:103](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialWindowComponent.ts#L103)

Sets the style that should be applied to the window

#### Parameters

##### styleParam

[`StyleParam`](../type-aliases/StyleParam.md)

#### Returns

`Promise`\<`void`\>
