[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialEntity

# Class: SpatialEntity

Entity used to describe an object that can be added to the scene

## Constructors

### new SpatialEntity()

> **new SpatialEntity**(`_entity`): [`SpatialEntity`](SpatialEntity.md)

#### Parameters

• **\_entity**: `WebSpatialResource`

#### Returns

[`SpatialEntity`](SpatialEntity.md)

#### Source

index.ts:23

## Properties

### \_destroyed

> `private` **\_destroyed**: `boolean` = `false`

#### Source

index.ts:22

***

### \_entity

> **\_entity**: `WebSpatialResource`

#### Source

index.ts:23

***

### transform

> **transform**: [`SpatialTransform`](SpatialTransform.md)

#### Source

index.ts:21

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Removes a reference to the entity by the renderer and this object should no longer be used. Attached components will not be destroyed

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:44

***

### isDestroyed()

> **isDestroyed**(): `boolean`

Check if destroy has been called

#### Returns

`boolean`

#### Source

index.ts:53

***

### setComponent()

> **setComponent**(`component`): `Promise`\<`void`\>

Attaches a component to the entity to be displayed

#### Parameters

• **component**: [`SpatialResource`](SpatialResource.md)

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:37

***

### updateTransform()

> **updateTransform**(): `Promise`\<`void`\>

Syncs the transform with the renderer, must be called to observe updates

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:30
