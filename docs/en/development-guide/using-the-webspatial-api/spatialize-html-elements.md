# Spatialize HTML Elements

Basic concept: [Spatialized Elements and 3D Container Elements](../../core-concepts/spatialized-elements-and-3d-container-elements.md)

---

> Because the [WebSpatial SDK](#) currently offers only a React SDK, all examples in this document use React.
>
> APIs covered in this section:
> - `enable-xr`, `__enableXr__`, `enableXr`
> - `cursor: pointer`

## Enable spatialization

With the current WebSpatial SDK an HTML element must be marked with a temporary flag before you can use any [other spatial APIs](#).

> In a future W3C specification an element will not need an explicit flag. Using a spatial API will implicitly make it a [spatialized HTML element](#). For now the flag is required for performance and other practical reasons.

You can apply the flag in three ways:

1. Add the attribute `enable-xr` to the element.

```jsx
<div className="card" enable-xr>
```

2. Add the marker `__enableXr__` to the element’s `className`.

```jsx
<div className="card __enableXr__">
```

3. Add the inline style `enableXr: true` to the element’s `style` prop.

```jsx
<div className="card" style={{ enableXr: true, marginTop: '10px' }}>
```

Supporting all three options lets you work with a wide range of third-party component libraries.

Most libraries expose at least one of these hooks (attribute, `className`, or `style`), so you can pass the flag down and spatialize the elements rendered inside the component.

Example 1:

```jsx
// third-party component
const Button = ({ children, className, style, ...rest }) => {
  return (
    <button
      className={`default-button ${className || ''}`}
      style={{ backgroundColor: 'blue', color: 'white', ...style }}
      {...rest}
    >
      {children}
    </button>
  );
};

// usage
<Button
  className="custom-btn __enableXr__"
  style={{ fontSize: '14px', enableXr: true }}
  data-testid="submit-btn"
  enable-xr
>
  Submit
</Button>
```

Example 2:

```jsx
// third-party component
const Card = ({
  children,
  headerClassName,
  headerStyle,
  headerProps,
}) => {
  return (
    <div className="card">
      <div
        className={`card-header ${headerClassName || ''}`}
        style={headerStyle}
        {...headerProps}
      >
        Card Title
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};

// usage
<Card
  headerClassName="custom-header  __enableXr__"
  headerStyle={{ backgroundColor: 'gray', enableXr: true }}
  headerProps={{ 'aria-label': 'Card Title', 'enable-xr': true }}
>
  Card Content
</Card>
```

After the flag is applied the element keeps all of its original capabilities and also gains access to the [spatial APIs](#) provided by the WebSpatial SDK, including the CSS APIs and DOM APIs described below.

## Cross-platform behavior

A spatialized element has spatial capabilities only when running inside the [WebSpatial App Shell](#).
On desktop or mobile browsers the build output does **not** include the WebSpatial SDK implementation. Calls to the WebSpatial API are removed automatically, and the elements remain ordinary HTML elements in the React DOM.

You therefore **do not need any if-else checks** when spatializing elements. The API works cross-platform by default.

## CSS capabilities

Inside a spatialized element you can use WebSpatial APIs in all common CSS authoring styles, including:

1. global embedded CSS

```diff
import React from 'react';

function App() {
  return (
    <div>
      <style>{`
        h1 {
+         --xr-background-material: translucent;
        }
      `}</style>
      <h1
+       enable-xr
      >Hello World</h1>
```

2. global linked CSS

```diff
import React from 'react';
import './styles.css';

function App() {
  return (
    <div>
      <h1
+       enable-xr
      >Hello World</h1>
```
```diff
h1 {
+ --xr-background-material: translucent;
}
```

3. inline CSS

```diff
import React from 'react';

function App() {
  return (
    <div>
      <h1
        style={{
+         '--xr-background-material': 'translucent'
        }}
+       enable-xr
      >Hello World</h1>
```

Dynamic CSS-in-JS solutions such as styled-components are also supported.

```diff
const StyledTitle = styled.h1`
+ --xr-background-material: translucent;
`
function App() {
  return (
    <div>
      <StyledTitle
+       enable-xr
      >Hello World</h1>
```

CSS Modules, PostCSS, and other pre-compiled CSS pipelines work as well.

## DOM capabilities

If you bypass React and manipulate the element directly through `querySelector` or similar DOM APIs, the [WebSpatial API will not work correctly](#).

Instead, obtain the DOM node via React’s Ref API, for example:

```diff
import React from 'react';

function App() {
  const ref = useRef(null)
  return (
    <div>
      <h1
+       ref={ref}
        className="title"
        style={{
          position: 'relative',
          '--xr-back': '100'
        }}
+       enable-xr
      >Hello World</h1>
```

You can then read or write `--xr-back` through `ref.current.style`, or remove it with `ref.current.style.removeProperty`.

You can also modify `ref.current.className` as needed.

If the original `style` or `className` contains WebSpatial properties, changing them through these DOM APIs immediately updates the spatial effect.

## Animation capabilities

The WebSpatial SDK does not yet support using spatial APIs inside pure CSS animations.
For animation effects use JavaScript—update the WebSpatial properties frame by frame with the Ref and DOM APIs mentioned above.

The following JavaScript animation libraries have been tested:

- Popmotion
- React Spring
- GSAP
- Tween.js
- Anime.js

## Internal interaction

Whether or not an element itself is spatialized, its child-element interactions on spatial platforms such as visionOS are based on *natural interaction*.

Most behaviors mirror touch interaction. One key difference is that during *indirect interaction* (eye-hand interaction) an element must qualify as an *Interaction Region* to receive the system-provided *Hover Effect*.

### Hover Effect

During the *Select (Navigation)* phase—indirect or direct—no JavaScript events fire and no CSS state changes (such as `:hover`) occur, just like on a touch screen.
The page has no knowledge of what the user is currently targeting.

> For privacy reasons only the operating system knows which element the user’s gaze is on or which element the finger is approaching; the web page itself does not.

Instead the operating system (including the browser engine) shows **native visual feedback**:
- In direct interaction, the motion of the user’s finger itself serves as feedback.
- In indirect interaction, the system renders a *Hover Effect* (for example, a glowing outline floating in front of the element under gaze). This is not the CSS `:hover` state; it is a native effect.

Only elements recognized as **Interaction Regions** can be targeted and will display the Hover Effect.

An element becomes an Interaction Region if any of the following is true:

- It is a native HTML button, link, or menu element, or any element with an equivalent ARIA role.
- It is an input or form element.
- Otherwise add the CSS property `cursor: pointer` to mark any element as an Interaction Region.

![](../../../assets/guide/hand-1.png)

### JavaScript events

After the *Confirm (Activate)* phase, indirect and direct interactions fire the same JavaScript events as touch screens:

| ![](../../../assets/guide/hand-2.png) | ![](../../../assets/guide/hand-3.png) |
|:---:|:---:|

For indirect interaction the sequence is:

1. At the moment of the pinch gesture, the system dispatches `pointerover`, `pointerenter`, and `pointerdown`.
2. A `touchstart` event is dispatched (touch emulation).
3. If the fingers stay pinched, moving the hand dispatches:
   1. `pointermove`
   2. `touchmove` (touch emulation)
4. When the fingers release, the system dispatches `pointerout`, `pointerleave`, and `pointerup`.
5. A `touchend` event follows (touch emulation).
6. For desktop compatibility a series of mouse events is then emulated: `mouseover`, `mouseenter`, `mousemove`, `mousedown`, `mouseup`, and the CSS `:hover` state (cleared when interacting elsewhere).
7. Finally a `click` event signifies the confirmed action.

You can build higher-level gestures such as drag-and-drop on top of these low-level events.

Example:
[![](../../../assets/guide/hand-4.png)](https://youtu.be/d8RcEiV-WM4?si=MyfgPKQ4qGZN80lw)

## Self interaction

> To be added

---

Next section: [Add Material Backgrounds](add-material-backgrounds.md)
