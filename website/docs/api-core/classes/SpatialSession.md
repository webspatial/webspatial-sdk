# Class: SpatialSession

Defined in: [SpatialSession.ts:66](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L66)

Session use to establish a connection to the spatial renderer of the system. All resources must be created by the session

## Constructors

### Constructor

> **new SpatialSession**(): `SpatialSession`

#### Returns

`SpatialSession`

## Methods

### addOnEngineUpdateEventListener()

> **addOnEngineUpdateEventListener**(`callback`): `void`

Defined in: [SpatialSession.ts:76](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L76)

Add event listener callback to be called each frame

#### Parameters

##### callback

`animCallback`

callback to be called each update

#### Returns

`void`

***

### createEntity()

> **createEntity**(`options?`): `Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

Defined in: [SpatialSession.ts:95](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L95)

Creates a Entity

#### Parameters

##### options?

`CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

Entity

***

### createInputComponent()

> **createInputComponent**(`options?`): `Promise`\<[`SpatialInputComponent`](SpatialInputComponent.md)\>

Defined in: [SpatialSession.ts:181](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L181)

Creates a InputComponent
[Experimental] Creates a InputComponent used to handle click and drag events of the entity containing a model

#### Parameters

##### options?

`CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialInputComponent`](SpatialInputComponent.md)\>

InputComponent

***

### createMeshResource()

> **createMeshResource**(`options?`): `Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

Defined in: [SpatialSession.ts:195](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L195)

Creates a MeshResource containing geometry data

#### Parameters

##### options?

`object` & `CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

MeshResource

***

### createModel3DComponent()

> **createModel3DComponent**(`options?`): `Promise`\<[`SpatialModel3DComponent`](SpatialModel3DComponent.md)\>

Defined in: [SpatialSession.ts:159](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L159)

Creates a Model3DComponent

#### Parameters

##### options?

`object` & `CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialModel3DComponent`](SpatialModel3DComponent.md)\>

Model3DComponent

***

### createModelComponent()

> **createModelComponent**(`options?`): `Promise`\<[`SpatialModelComponent`](SpatialModelComponent.md)\>

Defined in: [SpatialSession.ts:138](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L138)

Creates a ModelComponent used to display geometry + material of a 3D model

#### Parameters

##### options?

`object` & `CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialModelComponent`](SpatialModelComponent.md)\>

ModelComponent

***

### createPhysicallyBasedMaterialResource()

> **createPhysicallyBasedMaterialResource**(`options?`): `Promise`\<[`SpatialPhysicallyBasedMaterialResource`](SpatialPhysicallyBasedMaterialResource.md)\>

Defined in: [SpatialSession.ts:212](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L212)

Creates a PhysicallyBasedMaterial containing PBR material data

#### Parameters

##### options?

`CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialPhysicallyBasedMaterialResource`](SpatialPhysicallyBasedMaterialResource.md)\>

PhysicallyBasedMaterial

***

### createViewComponent()

> **createViewComponent**(`options?`): `Promise`\<[`SpatialViewComponent`](SpatialViewComponent.md)\>

Defined in: [SpatialSession.ts:124](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L124)

Creates a ViewComponent used to display 3D content within the entity

#### Parameters

##### options?

`CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialViewComponent`](SpatialViewComponent.md)\>

SpatialViewComponent

***

### createWindowComponent()

> **createWindowComponent**(`options?`): `Promise`\<[`SpatialWindowComponent`](SpatialWindowComponent.md)\>

Defined in: [SpatialSession.ts:110](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L110)

Creates a WindowComponent
[TODO] should creation of components be moved to entity? and these made private?

#### Parameters

##### options?

`CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialWindowComponent`](SpatialWindowComponent.md)\>

WindowComponent

***

### createWindowContainer()

> **createWindowContainer**(`options?`): `Promise`\<[`SpatialWindowContainer`](SpatialWindowContainer.md)\>

Defined in: [SpatialSession.ts:228](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L228)

Creates a WindowContainer

#### Parameters

##### options?

`object` & `CreateResourceOptions`

#### Returns

`Promise`\<[`SpatialWindowContainer`](SpatialWindowContainer.md)\>

SpatialWindowContainer

***

### createWindowContext()

> **createWindowContext**(): `Promise`\<`null` \| `Window`\>

Defined in: [SpatialSession.ts:399](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L399)

Creates a window context object that is compatable with SpatialWindowComponent's setFromWindow API

#### Returns

`Promise`\<`null` \| `Window`\>

window context

***

### dismissImmersiveSpace()

> **dismissImmersiveSpace**(): `Promise`\<`void`\>

Defined in: [SpatialSession.ts:344](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L344)

Closes the immersive space

#### Returns

`Promise`\<`void`\>

***

### getCurrentWindowComponent()

> **getCurrentWindowComponent**(): [`SpatialWindowComponent`](SpatialWindowComponent.md)

Defined in: [SpatialSession.ts:265](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L265)

Retrieves the window for this page

#### Returns

[`SpatialWindowComponent`](SpatialWindowComponent.md)

the window component corresponding to the js running on this page
[TODO] discuss implications of this not being async

***

### getCurrentWindowContainer()

> **getCurrentWindowContainer**(): [`SpatialWindowContainer`](SpatialWindowContainer.md)

Defined in: [SpatialSession.ts:373](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L373)

Gets the current window container for the window
[TODO] discuss what happens if it doesnt yet have a window container

#### Returns

[`SpatialWindowContainer`](SpatialWindowContainer.md)

the current window container for the window

***

### getImmersiveWindowContainer()

> **getImmersiveWindowContainer**(): `Promise`\<[`SpatialWindowContainer`](SpatialWindowContainer.md)\>

Defined in: [SpatialSession.ts:354](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L354)

Retreives the window container corresponding to the Immersive space

#### Returns

`Promise`\<[`SpatialWindowContainer`](SpatialWindowContainer.md)\>

the immersive window container

***

### getParentWindowComponent()

> **getParentWindowComponent**(): `Promise`\<`null` \| [`SpatialWindowComponent`](SpatialWindowComponent.md)\>

Defined in: [SpatialSession.ts:273](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L273)

Retrieves the parent window for this page or null if this is the root page

#### Returns

`Promise`\<`null` \| [`SpatialWindowComponent`](SpatialWindowComponent.md)\>

the window component or null

***

### log()

> **log**(...`msg`): `Promise`\<`void`\>

Defined in: [SpatialSession.ts:293](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L293)

Logs a message to the native apps console

#### Parameters

##### msg

...`any`[]

mesage to log

#### Returns

`Promise`\<`void`\>

***

### openImmersiveSpace()

> **openImmersiveSpace**(): `Promise`\<`void`\>

Defined in: [SpatialSession.ts:339](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L339)

Opens the immersive space

#### Returns

`Promise`\<`void`\>

***

### transaction()

> **transaction**(`fn`): `Promise`\<`unknown`\>

Defined in: [SpatialSession.ts:389](https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/SpatialSession.ts#L389)

Start a transaction that queues up commands to submit them all at once to reduce ipc overhead

#### Parameters

##### fn

`Function`

function to be run, within this function, promises will not resolve

#### Returns

`Promise`\<`unknown`\>

promise for the entire transaction completion
