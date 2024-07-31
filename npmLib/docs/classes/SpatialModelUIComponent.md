[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialModelUIComponent

# Class: SpatialModelUIComponent

Used to position a model in 3D space inline to the webpage (Maps to Model3D tag)
Positioning behaves the same as a spatial iframe marked as inline

## Extends

- [`SpatialResource`](SpatialResource.md)

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`SpatialResource`](SpatialResource.md).[`destroy`](SpatialResource.md#destroy)

#### Defined in

index.ts:105

***

### setAspectRatio()

> **setAspectRatio**(`aspectRatio`): `Promise`\<`void`\>

#### Parameters

• **aspectRatio**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:227

***

### setResolution()

> **setResolution**(`x`, `y`): `Promise`\<`void`\>

Sets the resolution of the component to be displayed (behaves the same as inline iframe)

#### Parameters

• **x**: `number`

resolution in pixels

• **y**: `number`

resolution in pixels

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:235

***

### setURL()

> **setURL**(`url`): `Promise`\<`void`\>

Sets the url of the model to load

#### Parameters

• **url**: `string`

url of the model to load

#### Returns

`Promise`\<`void`\>

#### Defined in

index.ts:224
