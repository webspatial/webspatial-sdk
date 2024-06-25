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

#### Source

index.ts:269

***

### createIFrameComponent()

> **createIFrameComponent**(`wg`?): `Promise`\<[`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

Creates a IFrameComponent

#### Parameters

• **wg?**: [`SpatialWindowGroup`](SpatialWindowGroup.md)

#### Returns

`Promise`\<[`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

IFrameComponent

#### Source

index.ts:278

***

### createMeshResource()

> **createMeshResource**(`options`?): `Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

Creates a MeshResource

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

MeshResource

#### Source

index.ts:309

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

#### Source

index.ts:296

***

### createModelUIComponent()

> **createModelUIComponent**(`options`?): `Promise`\<[`SpatialModelUIComponent`](SpatialModelUIComponent.md)\>

Creates a ModelUIComponent

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialModelUIComponent`](SpatialModelUIComponent.md)\>

ModelUIComponent

#### Source

index.ts:287

***

### createPhysicallyBasedMaterial()

> **createPhysicallyBasedMaterial**(`options`?): `Promise`\<[`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)\>

Creates a PhysicallyBasedMaterial

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)\>

PhysicallyBasedMaterial

#### Source

index.ts:318

***

### createWindowGroup()

> **createWindowGroup**(`style`): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

Creates a WindowGroup

#### Parameters

• **style**: `WindowStyle`= `"Plain"`

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

WindowGroup

#### Source

index.ts:327

***

### dismissImmersiveSpace()

> **dismissImmersiveSpace**(): `Promise`\<`void`\>

Closes the immersive space

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:359

***

### getCurrentIFrameComponent()

> **getCurrentIFrameComponent**(): [`SpatialIFrameComponent`](SpatialIFrameComponent.md)

Retrieves the iframe for this page

#### Returns

[`SpatialIFrameComponent`](SpatialIFrameComponent.md)

the iframe component corresponding to the js running on this page

#### Source

index.ts:335

***

### getCurrentWindowGroup()

> **getCurrentWindowGroup**(): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Source

index.ts:369

***

### getImmersiveWindowGroup()

> **getImmersiveWindowGroup**(): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Source

index.ts:364

***

### log()

> **log**(`obj`): `Promise`\<`void`\>

Debugging only, issues a native log

#### Parameters

• **obj**: `any`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:342

***

### openImmersiveSpace()

> **openImmersiveSpace**(): `Promise`\<`void`\>

Opens the immersive space

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:354

***

### ping()

> **ping**(`msg`): `Promise`\<`unknown`\>

Debugging only, used to ping the native renderer

#### Parameters

• **msg**: `string`

#### Returns

`Promise`\<`unknown`\>

#### Source

index.ts:349

***

### requestAnimationFrame()

> **requestAnimationFrame**(`callback`): `void`

Request a callback to be called before the next render update

#### Parameters

• **callback**: `animCallback`

callback to be called before next render update

#### Returns

`void`

#### Source

index.ts:250
