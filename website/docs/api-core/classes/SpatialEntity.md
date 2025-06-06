# Class: SpatialEntity

Defined in: [SpatialEntity.ts:10](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L10)

Entity used to describe an object that can be added to the scene

## Extends

- `SpatialObject`

## Properties

### name

> **name**: `string` = `''`

Defined in: [SpatialObject.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L23)

#### Inherited from

`SpatialObject.name`

***

### transform

> **transform**: [`SpatialTransform`](SpatialTransform.md)

Defined in: [SpatialEntity.ts:15](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L15)

Transform corresponding to the entity
note: updateTransform must be called for transform to be synced to rendering

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:129](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L129)

Removes a reference to the entity by the renderer and this object should no longer be used. [TODO] Attached components will not be destroyed

#### Returns

`Promise`\<`void`\>

#### Overrides

`SpatialObject.destroy`

***

### getBoundingBox()

> **getBoundingBox**(): `Promise`\<\{ `center`: \{ `x`: `number`; `y`: `number`; `z`: `number`; \}; `extents`: \{ `x`: `number`; `y`: `number`; `z`: `number`; \}; \}\>

Defined in: [SpatialEntity.ts:108](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L108)

Query the 3d boudning box of the entity

#### Returns

`Promise`\<\{ `center`: \{ `x`: `number`; `y`: `number`; `z`: `number`; \}; `extents`: \{ `x`: `number`; `y`: `number`; `z`: `number`; \}; \}\>

The bounding box of the entity

***

### getComponent()

> **getComponent**\<`T`\>(`type`): `undefined` \| `T`

Defined in: [SpatialEntity.ts:65](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L65)

Gets a component from the entity

#### Type Parameters

##### T

`T` *extends* `SpatialComponent`

#### Parameters

##### type

(...`args`) => `T`

#### Returns

`undefined` \| `T`

***

### isDestroyed()

> **isDestroyed**(): `boolean`

Defined in: [SpatialEntity.ts:137](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L137)

Check if destroy has been called

#### Returns

`boolean`

***

### onDestroy()

> `protected` **onDestroy**(): `Promise`\<`void`\>

Defined in: [SpatialObject.ts:25](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L25)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SpatialObject.onDestroy`

***

### removeComponent()

> **removeComponent**\<`T`\>(`type`): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:52](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L52)

Removes a component from the entity

#### Type Parameters

##### T

`T` *extends* `SpatialComponent`

#### Parameters

##### type

(...`args`) => `T`

#### Returns

`Promise`\<`void`\>

***

### setComponent()

> **setComponent**(`component`): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:44](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L44)

Attaches a component to the entity to be displayed
[TODO] review pass by value vs ref and ownership model for this

#### Parameters

##### component

`SpatialComponent`

#### Returns

`Promise`\<`void`\>

***

### setCoordinateSpace()

> **setCoordinateSpace**(`space`): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:100](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L100)

Sets the coordinate space of this entity (Default: App)
"App" = game engine style coordinates in meters
"Dom" = Windowing coordinates in dom units (eg. 0,0,0 is top left of window)
"Root" = Coordinate space is ignored and content is displayed and updated as window container's root object, window containers can only have one root entity
[TODO] review this api

#### Parameters

##### space

coordinate space mode

`"App"` | `"Dom"` | `"Root"`

#### Returns

`Promise`\<`void`\>

***

### setParent()

> **setParent**(`e`): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:86](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L86)

Sets a parent entity, if that entity or its parents are attached to a window container, this entity will be displayed

#### Parameters

##### e

parent entity or null to remove current parent

`null` | `SpatialEntity`

#### Returns

`Promise`\<`void`\>

***

### setVisible()

> **setVisible**(`visible`): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:122](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L122)

Sets if the entity should be visible (default: True)

#### Parameters

##### visible

`boolean`

#### Returns

`Promise`\<`void`\>

***

### updateTransform()

> **updateTransform**(): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:27](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L27)

Syncs the transform with the renderer, must be called to observe updates

#### Returns

`Promise`\<`void`\>

***

### updateZIndex()

> **updateZIndex**(`zIndex`): `Promise`\<`void`\>

Defined in: [SpatialEntity.ts:34](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialEntity.ts#L34)

Syncs the zIndex with the renderer

#### Parameters

##### zIndex

`number`

#### Returns

`Promise`\<`void`\>
