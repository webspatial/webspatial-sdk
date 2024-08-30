[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialWindowComponent

# Class: SpatialWindowComponent

Used to position an web window in 3D space

## Extends

<<<<<<< HEAD
- [`SpatialComponent`](SpatialComponent.md)
=======
- [`SpatialResource`](SpatialResource.md)
>>>>>>> main

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

<<<<<<< HEAD
[`SpatialComponent`](SpatialComponent.md).[`destroy`](SpatialComponent.md#destroy)

#### Defined in

SpatialObject.ts:15
=======
[`SpatialResource`](SpatialResource.md).[`destroy`](SpatialResource.md#destroy)

#### Defined in

SpatialResource/SpatialResource.ts:15
>>>>>>> main

***

### loadURL()

> **loadURL**(`url`): `Promise`\<`void`\>

Loads a url page in the window

#### Parameters

• **url**: `string`

url to load

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
component/SpatialWindowComponent.ts:12

***

### setAsRoot()

> **setAsRoot**(`makeRoot`): `Promise`\<`void`\>

Sets if this window can be used as the root element of a Plain window group. If set, this can be resized by the OS and its resolution will be set to full

#### Parameters

• **makeRoot**: `boolean`

sets if this should be root or not

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialWindowComponent.ts:27
=======
SpatialResource/SpatialWindowComponent.ts:12
>>>>>>> main

***

### setFromWindow()

> **setFromWindow**(`window`): `Promise`\<`void`\>

#### Parameters

• **window**: `any`

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
component/SpatialWindowComponent.ts:16

***

### setInline()

> **setInline**(`isInline`): `Promise`\<`void`\>

Sets how the window should be rendered. 
If inline, position will be relative to root webpage (0,0,0) will place the center of the window at the top left of the page and coordinate space will be in pixels.
If not inline, position will be relative to the window group origin, (0,0,0) will be the center of the window group and units will be in units of the window group (eg. meters for immersive window group)

#### Parameters

• **isInline**: `boolean`

value to set

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialWindowComponent.ts:63
=======
SpatialResource/SpatialWindowComponent.ts:16
>>>>>>> main

***

### setResolution()

> **setResolution**(`x`, `y`): `Promise`\<`void`\>

Sets the resolution of the window, the resulting dimensions when rendered will be equal to 1/1360 units
eg. if the resolution is set to 1360x1360 it will be a 1x1 plane

#### Parameters

• **x**: `number`

width in pixels

• **y**: `number`

height in pixels

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
component/SpatialWindowComponent.ts:37
=======
SpatialResource/SpatialWindowComponent.ts:30
>>>>>>> main

***

### setScrollEnabled()

> **setScrollEnabled**(`enabled`): `Promise`\<`void`\>

Enable/Disable scrolling in the window (defaults to enabled), if disabled, scrolling will be applied to the root page

#### Parameters

• **enabled**: `boolean`

value to set

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
component/SpatialWindowComponent.ts:53
=======
SpatialResource/SpatialWindowComponent.ts:46
>>>>>>> main

***

### setScrollWithParent()

> **setScrollWithParent**(`scrollWithParent`): `Promise`\<`void`\>

Defaults to false. If set to true, scrolling the parent page will also scroll this window with it like other dom elements

#### Parameters

• **scrollWithParent**: `boolean`

value to set

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
component/SpatialWindowComponent.ts:71
=======
SpatialResource/SpatialWindowComponent.ts:54
>>>>>>> main

***

### setStyle()

> **setStyle**(`options`): `Promise`\<`void`\>

Sets the style that should be applied to the window

#### Parameters

• **options**: `any`

style options

#### Returns

`Promise`\<`void`\>

#### Defined in

<<<<<<< HEAD
component/SpatialWindowComponent.ts:45
=======
SpatialResource/SpatialWindowComponent.ts:38
>>>>>>> main
