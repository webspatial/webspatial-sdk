# Class: Spatial

Defined in: [Spatial.ts:6](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/Spatial.ts#L6)

Base object designed to be placed on navigator.spatial to mirror navigator.xr for webxr

## Constructors

### Constructor

> **new Spatial**(): `Spatial`

#### Returns

`Spatial`

## Methods

### getClientVersion()

> **getClientVersion**(): `string`

Defined in: [Spatial.ts:45](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/Spatial.ts#L45)

Gets the client version, format is "x.x.x"

#### Returns

`string`

client version string

***

### getNativeVersion()

> **getNativeVersion**(): `any`

Defined in: [Spatial.ts:34](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/Spatial.ts#L34)

Gets the native version, format is "x.x.x"

#### Returns

`any`

native version string

***

### isSupported()

> **isSupported**(): `boolean`

Defined in: [Spatial.ts:26](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/Spatial.ts#L26)

#### Returns

`boolean`

true if web spatial is supported by this webpage

***

### requestSession()

> **requestSession**(): `null` \| [`SpatialSession`](SpatialSession.md)

Defined in: [Spatial.ts:12](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/Spatial.ts#L12)

Requests a session object from the browser

#### Returns

`null` \| [`SpatialSession`](SpatialSession.md)

The session or null if not availible in the current browser
[TODO] discuss implications of this not being async
