# Class: SpatialHelper

Defined in: [SpatialHelper.ts:11](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L11)

Helper class used to quickly add spatial content to standard web pages
[Experimental] expect APIs to potentially change in future versions

## Constructors

### Constructor

> **new SpatialHelper**(`session`): `SpatialHelper`

Defined in: [SpatialHelper.ts:29](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L29)

#### Parameters

##### session

[`SpatialSession`](SpatialSession.md)

#### Returns

`SpatialHelper`

## Properties

### dom

> **dom**: `object`

Defined in: [SpatialHelper.ts:172](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L172)

#### attachSpatialView()

> **attachSpatialView**: (`divOnPage`) => `Promise`\<\{ `entity`: [`SpatialEntity`](SpatialEntity.md); \}\>

##### Parameters

###### divOnPage

`HTMLElement`

##### Returns

`Promise`\<\{ `entity`: [`SpatialEntity`](SpatialEntity.md); \}\>

***

### navigation

> **navigation**: `object`

Defined in: [SpatialHelper.ts:79](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L79)

#### openPanel()

> **openPanel**: (`url`, `options?`) => `Promise`\<\{ `windowContainer`: [`SpatialWindowContainer`](SpatialWindowContainer.md); \}\>

##### Parameters

###### url

`string`

###### options?

###### resolution

\{ `height`: `number`; `width`: `number`; \}

###### resolution.height

`number`

###### resolution.width

`number`

##### Returns

`Promise`\<\{ `windowContainer`: [`SpatialWindowContainer`](SpatialWindowContainer.md); \}\>

#### openVolume()

> **openVolume**: (`url`, `options?`) => `Promise`\<`void`\>

##### Parameters

###### url

`string`

###### options?

###### resolution

\{ `height`: `number`; `width`: `number`; \}

###### resolution.height

`number`

###### resolution.width

`number`

##### Returns

`Promise`\<`void`\>

***

### session

> **session**: [`SpatialSession`](SpatialSession.md)

Defined in: [SpatialHelper.ts:29](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L29)

***

### shape

> **shape**: `object`

Defined in: [SpatialHelper.ts:31](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L31)

#### createModelEntity()

> **createModelEntity**: (`url`) => `Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

##### Parameters

###### url

`string`

##### Returns

`Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

#### createShapeEntity()

> **createShapeEntity**: (`shape`) => `Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

##### Parameters

###### shape

`string` = `'box'`

##### Returns

`Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

#### wrapInBoundingBoxEntity()

> **wrapInBoundingBoxEntity**: (`entityToWrap`) => `Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

##### Parameters

###### entityToWrap

[`SpatialEntity`](SpatialEntity.md)

##### Returns

`Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

## Accessors

### instance

#### Get Signature

> **get** `static` **instance**(): `null` \| `SpatialHelper`

Defined in: [SpatialHelper.ts:13](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L13)

##### Returns

`null` \| `SpatialHelper`

## Methods

### setBackgroundStyle()

> **setBackgroundStyle**(`style`, `backgroundColor`): `Promise`\<`void`\>

Defined in: [SpatialHelper.ts:223](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialHelper.ts#L223)

#### Parameters

##### style

[`StyleParam`](../type-aliases/StyleParam.md)

##### backgroundColor

`string` = `'#00000000'`

#### Returns

`Promise`\<`void`\>
