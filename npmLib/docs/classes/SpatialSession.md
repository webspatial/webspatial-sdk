[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialSession

# Class: SpatialSession

Session use to establish a connection to the spatial renderer of the system. All resources must be created by the session

## Constructors

### new SpatialSession()

> **new SpatialSession**(): [`SpatialSession`](SpatialSession.md)

#### Returns

[`SpatialSession`](SpatialSession.md)

## Methods

### createEntity()

> **createEntity**(): `Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

Creates a Entity

#### Returns

`Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

Entity

#### Defined in

SpatialSession.ts:49

***

### createIFrameComponent()

> **createIFrameComponent**(`wg`?): `Promise`\<[`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

Creates a IFrameComponent

#### Parameters

• **wg?**: [`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Returns

`Promise`\<[`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

IFrameComponent

#### Defined in

SpatialSession.ts:58

***

### createInputComponent()

> **createInputComponent**(): `Promise`\<[`SpatialInputComponent`](SpatialInputComponent.md)\>

Creates a InputComponent

#### Returns

`Promise`\<[`SpatialInputComponent`](SpatialInputComponent.md)\>

InputComponent

#### Defined in

SpatialSession.ts:89

***

### createMeshResource()

> **createMeshResource**(`options`?): `Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

Creates a MeshResource

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

MeshResource

#### Defined in

SpatialSession.ts:100

***

### createModelComponent()

> **createModelComponent**(`options`?): `Promise`\<[`SpatialModelComponent`](SpatialModelComponent.md)\>

Creates a ModelComponent

#### Parameters

• **options?**

• **options.url?**: `string`

#### Returns

`Promise`\<[`SpatialModelComponent`](SpatialModelComponent.md)\>

ModelComponent

#### Defined in

SpatialSession.ts:76

***

### createModelUIComponent()

> **createModelUIComponent**(`options`?): `Promise`\<[`SpatialModelUIComponent`](SpatialModelUIComponent.md)\>

Creates a ModelUIComponent

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialModelUIComponent`](SpatialModelUIComponent.md)\>

ModelUIComponent

#### Defined in

SpatialSession.ts:67

***

### createPhysicallyBasedMaterial()

> **createPhysicallyBasedMaterial**(`options`?): `Promise`\<[`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)\>

Creates a PhysicallyBasedMaterial

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)\>

PhysicallyBasedMaterial

#### Defined in

SpatialSession.ts:109

***

### createWindowGroup()

> **createWindowGroup**(`style`): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

Creates a WindowGroup

#### Parameters

• **style**: `WindowStyle` = `"Plain"`

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

WindowGroup

#### Defined in

SpatialSession.ts:118

***

### debug()

> **debug**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:161

***

### dismissImmersiveSpace()

> **dismissImmersiveSpace**(): `Promise`\<`void`\>

Closes the immersive space

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:186

***

### error()

> **error**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:165

***

### getCurrentIFrameComponent()

> **getCurrentIFrameComponent**(): [`SpatialIFrameComponent`](SpatialIFrameComponent.md)

Retrieves the iframe for this page

#### Returns

[`SpatialIFrameComponent`](SpatialIFrameComponent.md)

the iframe component corresponding to the js running on this page

#### Defined in

SpatialSession.ts:126

***

### getCurrentWindowGroup()

> **getCurrentWindowGroup**(): [`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Returns

[`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Defined in

SpatialSession.ts:196

***

### getImmersiveWindowGroup()

> **getImmersiveWindowGroup**(): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Defined in

SpatialSession.ts:191

***

### getParentIFrameComponent()

> **getParentIFrameComponent**(): `Promise`\<`null` \| [`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

Retrieves the parent iframe for this page or null if this is the root page

#### Returns

`Promise`\<`null` \| [`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

the iframe component or null

#### Defined in

SpatialSession.ts:134

***

### info()

> **info**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:153

***

### log()

> **log**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:149

***

### openImmersiveSpace()

> **openImmersiveSpace**(): `Promise`\<`void`\>

Opens the immersive space

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:181

***

### ping()

> **ping**(`msg`): `Promise`\<`unknown`\>

Debugging only, used to ping the native renderer

#### Parameters

• **msg**: `string`

#### Returns

`Promise`\<`unknown`\>

#### Defined in

SpatialSession.ts:176

***

### requestAnimationFrame()

> **requestAnimationFrame**(`callback`): `void`

Request a callback to be called before the next render update

#### Parameters

• **callback**: `animCallback`

callback to be called before next render update

#### Returns

`void`

#### Defined in

SpatialSession.ts:30

***

### setLogLevel()

> **setLogLevel**(`logLevel`): `Promise`\<`void`\>

#### Parameters

• **logLevel**: `LoggerLevel`

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:145

***

### trace()

> **trace**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:169

***

### warn()

> **warn**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:157
