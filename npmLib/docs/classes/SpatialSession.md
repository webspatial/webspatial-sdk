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

## Properties

### \_animationFrameCallbacks

> **\_animationFrameCallbacks**: `animCallback`[]

#### Source

index.ts:151

***

### \_currentFrame

> **\_currentFrame**: `SpatialFrame`

#### Source

index.ts:150

***

### \_frameLoopStarted

> **\_frameLoopStarted**: `boolean` = `false`

#### Source

index.ts:152

## Methods

### createEntity()

> **createEntity**(): `Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

#### Returns

`Promise`\<[`SpatialEntity`](SpatialEntity.md)\>

#### Source

index.ts:168

***

### createIFrameComponent()

> **createIFrameComponent**(): `Promise`\<[`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

#### Returns

`Promise`\<[`SpatialIFrameComponent`](SpatialIFrameComponent.md)\>

#### Source

index.ts:173

***

### createMeshResource()

> **createMeshResource**(`options`?): `Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialMeshResource`](SpatialMeshResource.md)\>

#### Source

index.ts:192

***

### createModelComponent()

> **createModelComponent**(`options`?): `Promise`\<[`SpatialModelComponent`](SpatialModelComponent.md)\>

#### Parameters

• **options?**

• **options.url?**: `string`

#### Returns

`Promise`\<[`SpatialModelComponent`](SpatialModelComponent.md)\>

#### Source

index.ts:183

***

### createModelUIComponent()

> **createModelUIComponent**(`options`?): `Promise`\<[`SpatialModelUIComponent`](SpatialModelUIComponent.md)\>

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialModelUIComponent`](SpatialModelUIComponent.md)\>

#### Source

index.ts:178

***

### createPhysicallyBasedMaterial()

> **createPhysicallyBasedMaterial**(`options`?): `Promise`\<[`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)\>

#### Parameters

• **options?**: `any`

#### Returns

`Promise`\<[`SpatialPhysicallyBasedMaterial`](SpatialPhysicallyBasedMaterial.md)\>

#### Source

index.ts:198

***

### dismissImmersiveSpace()

> **dismissImmersiveSpace**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:225

***

### getCurrentIFrameComponent()

> **getCurrentIFrameComponent**(): [`SpatialIFrameComponent`](SpatialIFrameComponent.md)

#### Returns

[`SpatialIFrameComponent`](SpatialIFrameComponent.md)

#### Source

index.ts:203

***

### getCurrentWindowGroup()

> **getCurrentWindowGroup**(): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Source

index.ts:235

***

### getImmersiveWindowGroup()

> **getImmersiveWindowGroup**(): `Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Returns

`Promise`\<[`SpatialWindowGroup`](SpatialWindowGroup.md)\>

#### Source

index.ts:230

***

### log()

> **log**(`obj`): `Promise`\<`void`\>

Debugging only, issues a native log

#### Parameters

• **obj**: `any`

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:210

***

### openImmersiveSpace()

> **openImmersiveSpace**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:221

***

### ping()

> **ping**(`msg`): `Promise`\<`unknown`\>

Debugging only, used to ping the native renderer

#### Parameters

• **msg**: `string`

#### Returns

`Promise`\<`unknown`\>

#### Source

index.ts:217

***

### requestAnimationFrame()

> **requestAnimationFrame**(`callback`): `void`

#### Parameters

• **callback**: `animCallback`

#### Returns

`void`

#### Source

index.ts:153
