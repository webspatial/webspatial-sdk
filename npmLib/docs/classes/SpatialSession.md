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

<<<<<<< HEAD
SpatialSession.ts:52
=======
SpatialSession.ts:49
>>>>>>> main

***

### createInputComponent()

> **createInputComponent**(): `Promise`\<[`SpatialInputComponent`](SpatialInputComponent.md)\>

Creates a InputComponent

#### Returns

`Promise`\<[`SpatialInputComponent`](SpatialInputComponent.md)\>

InputComponent

#### Defined in

SpatialSession.ts:92

***

### createMeshResource()

> **createMeshResource**(`options`?): `Promise`\<[`SpatialMesh`](SpatialMesh.md)\>

Creates a MeshResource

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialMesh`](SpatialMesh.md)\>

MeshResource

#### Defined in

SpatialSession.ts:103

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

SpatialSession.ts:79

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

SpatialSession.ts:70

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

SpatialSession.ts:112

***

### createWindowComponent()

> **createWindowComponent**(`wg`?): `Promise`\<[`SpatialWindowComponent`](SpatialWindowComponent.md)\>

Creates a WindowComponent

#### Parameters

• **wg?**: [`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Returns

`Promise`\<[`SpatialWindowComponent`](SpatialWindowComponent.md)\>

WindowComponent

#### Defined in

SpatialSession.ts:61

***

### createWindowComponent()

> **createWindowComponent**(`wg`?): `Promise`\<[`SpatialWindowComponent`](SpatialWindowComponent.md)\>

Creates a WindowComponent

#### Parameters

• **wg?**: [`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Returns

`Promise`\<[`SpatialWindowComponent`](SpatialWindowComponent.md)\>

WindowComponent

#### Defined in

SpatialSession.ts:58

***

### createWindowGroup()

> **createWindowGroup**(`style`): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

Creates a WindowGroup

#### Parameters

• **style**: [`WindowStyle`](../type-aliases/WindowStyle.md) = `"Plain"`

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

WindowGroup

#### Defined in

SpatialSession.ts:121

***

### debug()

> **debug**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:164

***

### dismissImmersiveSpace()

> **dismissImmersiveSpace**(): `Promise`\<`void`\>

Closes the immersive space

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
SpatialSession.ts:197
=======
SpatialSession.ts:194
>>>>>>> main

***

### error()

> **error**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:168

***

### getCurrentWindowComponent()

> **getCurrentWindowComponent**(): [`SpatialWindowComponent`](SpatialWindowComponent.md)

Retrieves the window for this page

#### Returns

[`SpatialWindowComponent`](SpatialWindowComponent.md)

the window component corresponding to the js running on this page

#### Defined in

SpatialSession.ts:129

***

### getCurrentWindowGroup()

> **getCurrentWindowGroup**(): [`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Returns

[`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Defined in

<<<<<<< HEAD
SpatialSession.ts:207
=======
SpatialSession.ts:204
>>>>>>> main

***

### getImmersiveWindowGroup()

> **getImmersiveWindowGroup**(): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Defined in

<<<<<<< HEAD
SpatialSession.ts:202
=======
SpatialSession.ts:199
>>>>>>> main

***

### getParentWindowComponent()

> **getParentWindowComponent**(): `Promise`\<`null` \| [`SpatialWindowComponent`](SpatialWindowComponent.md)\>

Retrieves the parent window for this page or null if this is the root page

#### Returns

`Promise`\<`null` \| [`SpatialWindowComponent`](SpatialWindowComponent.md)\>

the window component or null

#### Defined in

SpatialSession.ts:137

***

### getStats()

> **getStats**(): `Promise`\<`any`\>

Debugging to get internal state from native code

#### Returns

`Promise`\<`any`\>

data as a js object

#### Defined in

SpatialSession.ts:187

***

### getStats()

> **getStats**(): `Promise`\<`any`\>

Debugging to get internal state from native code

#### Returns

`Promise`\<`any`\>

data as a js object

#### Defined in

SpatialSession.ts:184

***

### info()

> **info**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:156

***

### log()

> **log**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:152

***

### openImmersiveSpace()

> **openImmersiveSpace**(): `Promise`\<`void`\>

Opens the immersive space

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
SpatialSession.ts:192
=======
SpatialSession.ts:189
>>>>>>> main

***

### ping()

> **ping**(`msg`): `Promise`\<`unknown`\>

Debugging only, used to ping the native renderer

#### Parameters

• **msg**: `string`

#### Returns

`Promise`\<`unknown`\>

#### Defined in

SpatialSession.ts:179

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

SpatialSession.ts:33

***

### setLogLevel()

> **setLogLevel**(`logLevel`): `Promise`\<`void`\>

#### Parameters

• **logLevel**: `LoggerLevel`

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:148

***

### trace()

> **trace**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:172

***

### warn()

> **warn**(...`msg`): `Promise`\<`void`\>

#### Parameters

• ...**msg**: `any`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

SpatialSession.ts:160
