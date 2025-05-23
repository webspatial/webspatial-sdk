# Class: SpatialViewComponent

Defined in: [component/SpatialViewComponent.ts:13](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialViewComponent.ts#L13)

Represenets a volume that can be added to the webpage
Child entities will be added within this volume's space
Defaults to having 1x1x1 meter dimensions
Resolution defaults to 100x100 pixels
Only will be displayed on entities in "ROOT" or "DOM" space
If the resolution of the spatial view is not a square, the volume will be larger based on the ratio with the shortest side being 1 meter.
(eg. 200x100 = 2m x 1m x 1m volume)

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

### onDestroy()

> `protected` **onDestroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:25](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L25)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialComponent.onDestroy`

***

### setIsPortal()

> **setIsPortal**(`isPortal`): `Promise`\<`void`\>

Defined in: [component/SpatialViewComponent.ts:27](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialViewComponent.ts#L27)

Sets if content of the spatialView should be within a portal
If true, volume will be behind the page, if false, it will be in front of the page

#### Parameters

##### isPortal

`Boolean`

#### Returns

`Promise`\<`void`\>

***

### setResolution()

> **setResolution**(`width`, `height`): `Promise`\<`void`\>

Defined in: [component/SpatialViewComponent.ts:17](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialViewComponent.ts#L17)

Sets the resolution of the spatial view in dom pixels

#### Parameters

##### width

`number`

##### height

`number`

#### Returns

`Promise`\<`void`\>
