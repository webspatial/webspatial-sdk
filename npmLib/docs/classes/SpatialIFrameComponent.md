[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialIFrameComponent

# Class: SpatialIFrameComponent

Used to position an iframe in 3D space

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

#### Source

index.ts:96

***

### loadURL()

> **loadURL**(`url`): `Promise`\<`void`\>

Loads a url page in the iframe

#### Parameters

• **url**: `string`

url to load

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:109

***

### sendContent()

> **sendContent**(`content`): `Promise`\<`void`\>

Sends a message to the iframe telling it to display the content string

#### Parameters

• **content**: `string`

Content to be displayed

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:135

***

### setAsRoot()

> **setAsRoot**(`makeRoot`): `Promise`\<`void`\>

Sets if this IFrame can be used as the root element of a Plain window group. If set, this can be resized by the OS and its resolution will be set to full

#### Parameters

• **makeRoot**: `boolean`

sets if this should be root or not

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:117

***

### setInline()

> **setInline**(`isInline`): `Promise`\<`void`\>

Sets how the iframe should be rendered. 
If inline, position will be relative to root webpage (0,0,0) will place the center of the iframe at the top left of the page and coordinate space will be in pixels.
If not inline, position will be relative to the window group origin, (0,0,0) will be the center of the window group and units will be in units of the window group (eg. meters for immersive window group)

#### Parameters

• **isInline**: `boolean`

value to set

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:161

***

### setResolution()

> **setResolution**(`x`, `y`): `Promise`\<`void`\>

Sets the resolution of the IFrame, the resulting dimensions when rendered will be equal to 1/1360 units
eg. if the resolution is set to 1360x1360 it will be a 1x1 plane

#### Parameters

• **x**: `number`

width in pixels

• **y**: `number`

height in pixels

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:127

***

### setScrollEnabled()

> **setScrollEnabled**(`enabled`): `Promise`\<`void`\>

Enable/Disable scrolling in the iframe (defaults to enabled), if disabled, scrolling will be applied to the root page

#### Parameters

• **enabled**: `boolean`

value to set

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:151

***

### setStyle()

> **setStyle**(`options`): `Promise`\<`void`\>

Sets the style that should be applied to the iframe

#### Parameters

• **options**: `any`

style options

#### Returns

`Promise`\<`void`\>

#### Source

index.ts:143
