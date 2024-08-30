[**web-spatial**](../README.md) • **Docs**

***

[web-spatial](../globals.md) / SpatialWindowComponent

# Class: SpatialWindowComponent

Used to position an web window in 3D space

## Extends

- [`SpatialComponent`](SpatialComponent.md)

## Methods

### destroy()

> **destroy**(): `Promise`\<`void`\>

Marks resource to be released (it should no longer be used)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`SpatialComponent`](SpatialComponent.md).[`destroy`](SpatialComponent.md#destroy)

#### Defined in

SpatialObject.ts:15

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

component/SpatialWindowComponent.ts:12

***

### setFromWindow()

> **setFromWindow**(`window`): `Promise`\<`void`\>

#### Parameters

• **window**: `any`

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialWindowComponent.ts:16

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

component/SpatialWindowComponent.ts:30

***

### setScrollEdgeInsets()

> **setScrollEdgeInsets**(`insets`): `Promise`\<`void`\>

Modifies the amount the spatial window can be scrolled
Should only be used internally
See https://developer.apple.com/documentation/uikit/1624475-uiedgeinsetsmake?language=objc

#### Parameters

• **insets**

margin to modify scroll distances by

• **insets.bottom**: `number`

• **insets.left**: `number`

• **insets.right**: `number`

• **insets.top**: `number`

#### Returns

`Promise`\<`void`\>

#### Defined in

component/SpatialWindowComponent.ts:48

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

component/SpatialWindowComponent.ts:56

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

component/SpatialWindowComponent.ts:64

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

component/SpatialWindowComponent.ts:38
