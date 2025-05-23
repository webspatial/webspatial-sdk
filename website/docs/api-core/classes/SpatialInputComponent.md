# Class: SpatialInputComponent

Defined in: [component/SpatialInputComponent.ts:14](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialInputComponent.ts#L14)

Used to handle input events on an entity

## Extends

- `EventSpatialComponent`

## Constructors

### Constructor

> **new SpatialInputComponent**(`_resource`): `SpatialInputComponent`

Defined in: [component/EventSpatialComponent.ts:15](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/EventSpatialComponent.ts#L15)

#### Parameters

##### \_resource

`WebSpatialResource`

#### Returns

`SpatialInputComponent`

#### Inherited from

`EventSpatialComponent.constructor`

## Properties

### name

> **name**: `string` = `''`

Defined in: [SpatialObject.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialObject.ts#L23)

#### Inherited from

`EventSpatialComponent.name`

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

Defined in: [component/SpatialInputComponent.ts:15](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialInputComponent.ts#L15)

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

### onTranslate()

> **onTranslate**(`data`): `void`

Defined in: [component/SpatialInputComponent.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/component/SpatialInputComponent.ts#L23)

Callback fired when a translate event occurs

#### Parameters

##### data

`TranslateEvent`

translate event data

#### Returns

`void`
