# Class: XRApp

Defined in: [XRApp.ts:14](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L14)

## Constructors

### Constructor

> **new XRApp**(): `XRApp`

#### Returns

`XRApp`

## Methods

### deinit()

> **deinit**(): `void`

Defined in: [XRApp.ts:41](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L41)

#### Returns

`void`

***

### handleATag()

> **handleATag**(`event`): `void`

Defined in: [XRApp.ts:23](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L23)

#### Parameters

##### event

`MouseEvent`

#### Returns

`void`

***

### init()

> **init**(): `void`

Defined in: [XRApp.ts:36](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L36)

#### Returns

`void`

***

### initScene()

> **initScene**(`name`, `callback`): `void`

Defined in: [XRApp.ts:124](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L124)

#### Parameters

##### name

`string`

##### callback

(`pre`) => [`WindowContainerOptions`](../interfaces/WindowContainerOptions.md)

#### Returns

`void`

***

### open()

> **open**(`url?`, `target?`, `features?`): `null` \| `Window`

Defined in: [XRApp.ts:70](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L70)

#### Parameters

##### url?

`string`

##### target?

`string`

##### features?

`string`

#### Returns

`null` \| `Window`

***

### show()

> **show**(`window`, `cfg`): `Promise`\<`void`\>

Defined in: [XRApp.ts:52](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L52)

#### Parameters

##### window

`Window`

##### cfg

[`WindowContainerOptions`](../interfaces/WindowContainerOptions.md)

#### Returns

`Promise`\<`void`\>

***

### getInstance()

> `static` **getInstance**(): `XRApp`

Defined in: [XRApp.ts:16](https://github.com/webspatial/webspatial-sdk/blob/main/react/src/XRApp.ts#L16)

#### Returns

`XRApp`
