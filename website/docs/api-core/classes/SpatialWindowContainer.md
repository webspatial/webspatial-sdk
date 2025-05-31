# Class: SpatialWindowContainer

Defined in: [SpatialWindowContainer.ts:11](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialWindowContainer.ts#L11)

Anchored window managed by the OS

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [SpatialWindowContainer.ts:54](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialWindowContainer.ts#L54)

#### Returns

`Promise`\<`void`\>

***

### getRootEntity()

> **getRootEntity**(): `Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

Defined in: [SpatialWindowContainer.ts:34](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialWindowContainer.ts#L34)

Retrieves the root entity of the windowContainer

#### Returns

`Promise`\<`null` \| [`SpatialEntity`](SpatialEntity.md)\>

the root entity of the windowContainer if one exists

***

### setRootEntity()

> **setRootEntity**(`entity`): `Promise`\<`void`\>

Defined in: [SpatialWindowContainer.ts:50](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialWindowContainer.ts#L50)

#### Parameters

##### entity

[`SpatialEntity`](SpatialEntity.md)

#### Returns

`Promise`\<`void`\>
