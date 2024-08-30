[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialEntity

# Class: SpatialEntity

Entity used to describe an object that can be added to the scene

## Extends

- `SpatialObject`

## Properties

### transform

> **transform**: [`SpatialTransform`](SpatialTransform.md)

#### Defined in

SpatialEntity.ts:11

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Removes a reference to the entity by the renderer and this object should no longer be used. Attached components will not be destroyed

#### Returns

`Promise`\<`void`\>

#### Overrides

`SpatialObject.destroy`

#### Defined in

SpatialEntity.ts:57

***

### isDestroyed()

> **isDestroyed**(): `boolean`

Check if destroy has been called

#### Returns

`boolean`

#### Defined in

SpatialEntity.ts:66

***

### setComponent()

> **setComponent**(`component`): `Promise`\<`void`\>

Attaches a component to the entity to be displayed

#### Parameters

• **component**: [`SpatialComponent`](SpatialComponent.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialEntity.ts:30

***

### setCoordinateSpace()

> **setCoordinateSpace**(`space`): `Promise`\<`void`\>

#### Parameters

• **space**: `"App"` \| `"Dom"` \| `"Root"`

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialEntity.ts:50

***

### setParent()

> **setParent**(`e`): `Promise`\<`void`\>

Sets a parent entity, if that entity or its parents are attached to a window group, this entity will be displayed

#### Parameters

• **e**: `null` \| [`SpatialEntity`](SpatialEntity.md)

parent entity or null to remove current parent

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialEntity.ts:46

***

### setParentWindowGroup()

> **setParentWindowGroup**(`wg`): `Promise`\<`void`\>

Sets the windowgroup that this entity should be rendered by (this does not effect resource ownership)

#### Parameters

• **wg**: [`SpatialWindowGroup`](SpatialWindowGroup.md)

the window group that should render this entity

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialEntity.ts:38

***

### updateTransform()

> **updateTransform**(): `Promise`\<`void`\>

Syncs the transform with the renderer, must be called to observe updates

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialEntity.ts:23
