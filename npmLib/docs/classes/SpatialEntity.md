[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialEntity

# Class: SpatialEntity

Entity used to describe an object that can be added to the scene

## Properties

### transform

> **transform**: [`SpatialTransform`](SpatialTransform.md)

#### Defined in

index.ts:43

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Removes a reference to the entity by the renderer and this object should no longer be used. Attached components will not be destroyed

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:80

***

### isDestroyed()

> **isDestroyed**(): `boolean`

Check if destroy has been called

#### Returns

`boolean`

#### Defined in

index.ts:89

***

### setComponent()

> **setComponent**(`component`): `Promise`\<`void`\>

Attaches a component to the entity to be displayed

#### Parameters

• **component**: [`SpatialResource`](SpatialResource.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:65

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

index.ts:73

***

### updateTransform()

> **updateTransform**(): `Promise`\<`void`\>

Syncs the transform with the renderer, must be called to observe updates

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:58
