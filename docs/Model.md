# Model

## Overview
The `<Model>`component handles loading 3D assets, managing playback of embedded animations, and responding to spatial user interactions.

## Attributes

Like standard HTML elements, the `<Model>` component supports a range of attributes (passed as React props) to control its behavior.

`src`

The URL of the 3D model to embed. This attribute has the highest priority when multiple sources are provided. If `src` is specified, it will be the first source attempted for loading.

`poster`

A URL for an image to be shown while the 3D model is downloading or if it fails to load. If this attribute is not specified, a default loading spinner will be displayed

`loading`

Specifies how the model should be loaded.

- `eager` (default): The model begins loading immediately.
- `lazy` The model loading is deferred until it enters the webview's viewport. This is handled natively to ensure accurate intersection detection and optimal performance.

`autoplay`

A Boolean attribute; if `true`, the model's first available animation will automatically begin to play as soon as the model has successfully loaded.

`loop`

A Boolean attribute; if `true`, the animation will automatically seek back to the start upon reaching the end.

`stagemode`

Controls the built-in user interaction mode for the model.
  - **none** (default): No built-in interaction is enabled. All interactions must be handled via spatial events.
  - `orbit` Enables a native orbit interaction mode. Allows users to rotate the model by dragging. When in orbit mode `entityTransform` becomes read-only and gesture handlers `onSpatialDragStart`, `onSpatialDrag`, and `onSpatialDragEnd` are disabled

## Events

The `<Model>` component fires several events to allow developers to monitor its state and respond to user interactions. These are exposed as `on...` props.

`onLoad`

Fired when the 3D model has successfully loaded and is ready for display and interaction. If multiple sources are provided, this event fires only for the first source that loads successfully.

`onError`

Fired when the model fails to load. If multiple sources are provided, this event is fired only after **all** sources have been attempted and have failed. It does not fire each individual source failure.

`onSpatialTap`

Fired when a user performs a tap gesture on the model in the spatial environment.

`onSpatialDragStart`

Fired when a user begins a drag gesture on the model.

`onSpatialDrag`

Fired continuously as the user drags the model.

`onSpatialDragEnd`

Fired when the user releases the drag gesture.

`onSpatialRotate`

Fired when a user performs a rotation gesture on the model.

`onSpatialRotateEnd`

Fired when the user completes the rotation gesture.

`onSpatialMagnify`

Fired when a user performs a magnification (pinch) gesture to scale the model.

`onSpatialMagnifyEnd`

Fired when the user completes the magnification gesture.

## JavaScript API

In addition to the DOM API relating to the source, animation, and environment map, the JavaScript API has additional capabilities relating to the animation timing and view parameters.

`currentSrc`

read-only string returning the URL to the loaded resource.

`ready`

Resolved when the model's source file has been loaded and processed. The Promise is rejected if the source file is unable to be fetched, or if the file cannot be interpreted as a valid `<model>` asset.

`entityTransform`

a read-write `DOMMatrixReadOnly` that expresses the current mapping of the view of the model contents to the view displayed in the browser.

`boundingBoxCenter`

a read-only `DOMPoint` that indicates the center of the axis-aligned bounding box (AABB) of the model contents. If there is an animation present, the bounding box is computed based on the bind pose of the animation and remains static for the lifetime of the model. It does not update based on a change of the `entityTransform`.

`boundingBoxExtents`

a read-only `DOMPoint` that indicates the extents of the bounding box of the model contents.

`duration`

a read-only `double` reflecting the un-scaled total duration of the animation, if present. If there is no animation on this model, the value is 0.

`currentTime`

a read-write `double` reflecting the un-scaled playback time of the model animation, if present. It is clamped to the duration of the animation, so for an animation with no animation, the value is always 0.

`playbackRate`

a read-write `double` reflecting the time scaling for animations, if present. For example, a model with a ten-second animation and a `playbackRate` of 0.5 will take 20 seconds to complete.

`paused`

A read-only `Boolean` value indicating whether the element has an animation that is currently playing.

`play()`

A method that attempts to play a model's animation, if present. It returns a `Promise` that resolves when playback has been successfully started.

`pause()`

A method that attempts to pause the playback of a model's animation. If the model is already paused this method will have no effect.

## Usage Notes
- **Multiple source elements:** Browsers don't all support the same 3D model formats; you can provide multiple sources inside nested <source> elements, and the browser will then use the first one it understands. When using <source> elements, the browser attempts to load each source sequentially. If a source fails (e.g., due to an invalid URL or unsupported format), the next source is attempted, and so on. An `error` event fires on the `<Model>` element after all sources have failed; `error` events are not fired on each individual `<source>` element.

- **Orbit Interaction Conflicts**: Setting the `stagemode` attribute to `orbit` results in an ***orbit*** interaction mode, where the `entityTransform` becomes read-only, and the view is updated exclusively based on input events from the user. Native gesture handlers `onSpatialDragStart`, `onSpatialDrag`, and `onSpatialDragEnd` are disabled

## Examples
### Single `src`

A basic model embed using the `src` attribute.

```javascript
import { Model } from '@webspatial/react-sdk';

function MyScene() { return (<Model src="/modelasset/Duck.glb" />); }
```

### Multiple `<source>` elements
Providing both USDZ and GLB formats for cross-platform compatibility.

```jsx
import { Model } from '@webspatial/react-sdk';

function MyScene() {
  return (
    <Model>
      <source src="/modelasset/vehicle.usdz" type="model/vnd.usdz+zip" />
      <source src="/modelasset/vehicle.glb" type="model/gltf-binary" />
    </Model>
  );
}
```

### Using a `poster` image

Display a poster while the model is loading.

```javascript
import { Model } from '@webspatial/react-sdk';

function MyScene() {
  return <Model src="/MaterialsVariantsShoe.glb" poster="/shoe-poster.png" />;
}
```

### Autoplay and loop

Automatically play a model's animation in a loop.

```jsx
import { Model } from '@webspatial/react-sdk';

function AnimatedModel() {
  return <Model src="/animated-robot.glb" autoplay loop />;
}
```

### Orbit interaction mode

Enable built-in drag-to-rotate functionality.

```jsx
import { Model } from '@webspatial/react-sdk';

function OrbitingDuck() {
  return <Model src="/modelasset/Duck.glb" stagemode="orbit" />;
}
```

### Lazy loading a model

Defer loading until the model is scrolled into view.

```jsx
import { Model } from '@webspatial/react-sdk';

function LongScrollPage() {
  return (
    <div>
      {/* ... a lot of content ... */}
      <Model loading="lazy" src="/modelasset/cone.glb" />
    </div>
  );
}
```

## Technical Summary

|||
| --- | --- |
| Permitted content | If the element has a `src` attribute: zero or more  elements (for future compatibility), followed by transparent content that contains no media elements. Else: zero or more  elements, followed by zero or more  elements, followed by transparent content. |
| Permitted parents | Any element that accepts embedded content. |
| Tag omission | The start tag is required. The end tag can be omitted if there are no child elements |
| Implicit ARIA role | `none` |
| Permitted ARIA roles | `application` |
| DOM interface | The React `ref` provides an interface compliant with `SpatializedStatic3DElementRef`, which extends `HTMLDivElement` and adds properties like `currentSrc`, `ready`, and `entityTransform`. |

## Browser Compatibility
### HTML
| Property | visionOS | Pico OS 6 |
| --- | --- | --- |
| model | ✅<br>WebSpatial 1.1 | ❌ |
| enable-xr | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| src | ✅<br>WebSpatial 1.1 | ✅ (USD/USDZ/GLB/GLTF)<br>⍺2.0 |
| onLoad | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| onError | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| autoplay | WebSpatial April | ⍺2.1 |
| loop | WebSpatial April | ⍺2.1 |
| `<source>` | WebSpatial April | ⍺2.1 |
| stagemode | WebSpatial May | β2.0 |
| poster | WebSpatial May | β2.0 |
| loading | WebSpatial June | β2.1 |

### CSS
| Style | visionOS | Pico OS |
| --- | --- | --- |
| --xr-depth | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| --xr-back | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| width | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| height | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| translate, translateX, translateY, translateZ translate3d | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| rotate, rotateX, rotateY, rotateZ, rotate3d | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |
| scale, scaleX, scaleY, scaleZ, scale3d | ✅<br>WebSpatial 1.1 | ✅<br>⍺2.0 |

### Javascript
| Style | visionOS | Pico OS |
| --- | --- | --- |
| entityTransform | ✅<br>WebSpatial 1.2 | ✅<br>⍺2.0 |
| currentSrc | ✅<br>WebSpatial 1.2 | ✅<br>⍺2.0 |
| ready | ✅<br>WebSpatial 1.2 | ✅<br>⍺2.0 |
| duration | WebSpatial April | ⍺2.1 |
| playbackRate | WebSpatial April | ⍺2.1 |
| paused | WebSpatial April | ⍺2.1 |
| play() | WebSpatial April | ⍺2.1 |
| pause() | WebSpatial April | ⍺2.1 |
| currentTime | WebSpatial May | β2.0 |
| boundingBoxCenter | WebSpatial June | β2.1 |
| boundingBoxExtents | WebSpatial June | β2.1 |

## High-Level Architecture
The implementation will touch four key areas of the WebSpatial SDK.

1. **@webspatial/react-sdk**: The public-facing `<Model>` component and its underlying `SpatializedStatic3DElementContainer` will be updated to accept the new attributes (`poster`, `loading`, `autoplay`, `loop`, `stagemode`) and children (`<source>`). It will also expose the new animation control methods on its `ref`.

2. **@webspatial/core-sdk**: The `SpatializedStatic3DElement` class will manage the state for the new features. New JSB (JavaScript Bridge) commands will be defined in `JSBCommand.ts` to communicate instructions to the native layer, and new `WebMsg` types will be defined in `WebMsgCommand.ts` for events coming from native.

3. **packages/visionOS (Native Swift)**: The native layer will receive JSB commands and translate them into actions. `SpatializedStatic3DView.swift` will handle the rendering logic, `Model3D` loading, gesture recognition for orbit mode, and managing `AnimationPlaybackController` for animations. It will send events back to the web layer via `WebMsgCommand`.

4. **apps/test-server**: New test pages will be created to demonstrate and validate each of the new features in isolation and combination.

## Feature Implementation Details

### 4. Animation Playback and Control

#### 4.1. React SDK (`@webspatial/react-sdk`)

- **New Props**: The `ModelProps` type will be extended to include:
	- `autoplay?: boolean`: If true, the model's first animation will play automatically upon successful load.
	- `loop?: boolean`: If true, animations will loop indefinitely.

- **Ref API Extension**: The `SpatializedStatic3DElementRef` type in `types.ts` will be expanded. We will augment the `ref` object in `SpatializedStatic3DElementContainer.tsx` with the following methods and properties:
	- `play(): Promise<void>`: Sends a JSB command to the native layer to start or resume the animation.
	- `pause(): void`: Sends a JSB command to pause the animation.
	- `paused: boolean` (read-only): Reflects the current playback state, managed by events from native.
	- `currentTime: number` (read/write): Gets or sets the current playback time. Setting it sends a "seek" JSB command. Synced from the native animation controller and is throttled to update at most once per second for bridge efficiency.
	- `duration: number` (read-only): Reports the total duration of the current animation.
	- `playbackRate: number` (read/write): Gets or sets the playback speed.

#### 4.2. Core SDK (`@webspatial/core-sdk`)

- **New JSB Commands**: We will define a new set of commands in `JSBCommand.ts` for animation control, all targeting a `SpatializedStatic3DElement`.
	- `PlayAnimationCommand(id: string)`
	- `PauseAnimationCommand(id: string)`
	- `SetAnimationTimeCommand(id: string, time: number)`
	- `SetPlaybackRateCommand(id: string, rate: number)`

- **New Properties**: The `UpdateSpatializedStatic3DElementProperties` command will be extended to carry `autoplay` and `loop` booleans.

- **New WebMsg Events**: To sync state from native back to the web, we'll define new events in `WebMsgCommand.ts`:
	- `AnimationStateChange(id: string, detail: { paused: boolean, duration: number })`
	- `AnimationTimeUpdate(id: string, detail: { currentTime: number })`

- **State Synchronization**: The `SpatializedStatic3DElement` class will listen for these new events and update its internal state, which will, in turn, be exposed via the React `ref`.

#### 4.3. Native visionOS Layer (`packages/visionOS`)

The bulk of the animation logic resides in the native layer.

- **Receiving Commands**: `JSBManager.swift` will be updated to decode the new animation commands and dispatch them to the correct `SpatializedStatic3DElement` instance.

- **Animation Playback Management**:
	1. In `SpatializedStatic3DView.swift`, create a `Model3DAsset` and pass it to `Model3D`.
	2. We can access the available animations via `modelAsset.availableAnimations`. By default, we will operate on the **first** animation.
	3. The `play()`, `pause()`, `seek(to:)` methods on the `AnimationPlaybackController` will be used to implement the JSB command handlers. This controller is obtained from the `ModelEntity` using `modelEntity.playAnimation()`.
	4. The `autoplay` and `loop` properties will be handled here. If `autoplay` is true, we will immediately call `play()` after the model loads. The `repeat` mode of the animation controller will be configured based on the `loop` flag.

- **State Reporting**: A timer (e.g., `Timer.publish`) will be set up in `SpatializedStatic3DView.swift` to periodically check the `currentTime` of the `AnimationPlaybackController` and send `AnimationTimeUpdate` messages back to the web layer to keep the `ref.currentTime` property in sync. The max frequency will be 1Hz to avoid saturating the JSB bridge. `AnimationStateChange` will be sent whenever playback starts, pauses, or the duration becomes known.

```swift
struct RobotView: View {
  @State private var asset: Model3DAsset?
  var body: some View {
    if asset == nil {
      ProgressView().task { 
        asset = try? await Model3DAsset(named: "sparky") 
        guard let asset = asset else { return }
        asset.selectedAnimation = asset.availableAnimations.first
        guard controller = asset.animationPlaybackController else { return }
        controller.resume()
      }
    } else if let asset {
      Model3D(asset: asset)
    }
  }
}
```
[Reference](https://developer.apple.com/videos/play/wwdc2025/274/?time=243)

### 5. Native Orbit Interaction (`stagemode="orbit"`)

This feature provides a built-in, intuitive way for users to inspect a 3D model from different angles using familiar drag gestures, without requiring developers to write complex gesture-handling code.

#### 5.1. React SDK (`@webspatial/react-sdk`)

- **New Prop**: The `ModelProps` type will be extended to accept `stagemode?: 'orbit' | 'none'`. The default will be `'none'`.

#### 5.2. Core SDK (`@webspatial/core-sdk`)

- **New Property**: The `UpdateSpatializedStatic3DElementProperties` command in `JSBCommand.ts` will be extended to include the `stagemode` string. This property will be sent to the native layer.

#### 5.3. Native visionOS Layer (`packages/visionOS`)
1. In `SpatializedStatic3DView.swift`, we will check for the `stagemode` property on the `SpatializedStatic3DElement`.
2. If `stagemode` is `"orbit"`, we will add a `DragGesture` to the view.
3. The `onChanged` handler for the `DragGesture` will be used to manipulate the model's orientation.
	- A horizontal drag (`event.translation.width`) will be mapped to a rotation around the model's Y-axis.
	- A vertical drag (`event.translation.height`) will be mapped to a rotation around the model's X-axis (pitch).
4. A state variable (e.g., `@State private var orbitRotation: Angle3D = .zero`) will be used to accumulate the rotation from the drag gesture. This rotation will be applied to the model using the `.rotation3DEffect()` modifier on the `Model3D` view.

- **Interaction with&nbsp;entityTransform**: `entityTransform` will not be updated when the model is rotated using the orbit gesture. Similarly updates to `entityTransform` will not affect the model's orientation.

- **Gesture Conflict Resolution**: `onSpatialDragStart`, `onSpatialDrag`, and `onSpatialDragEnd` will be disabled when stagemode is set to orbit.

### 6.Source Selection (`src` and `<source>` elements)

To provide developers with flexibility and ensure the best model format is used, the `<Model>` component will support both a direct `src` attribute and nested `<source>` elements, mimicking the behavior of the HTML `<video>` tag. The core logic for iterating through sources will now reside in the native layer to simplify web-side code and centralize loading responsibility.

#### 6.1. React SDK (`@webspatial/react-sdk`)

- **Component Signature**: The `ModelProps` type will be updated to accept `children`.

- **Source Gathering Logic**: In `SpatializedStatic3DElementContainer.tsx`, the logic will focus purely on collecting an ordered list of sources.
	1. The `src` prop on the `<Model>` component is treated as the highest priority source.
	2. `React.Children.toArray` will be used to iterate over `children`, filtering for `<source>` elements.
	3. A `sources` array of objects `{ src: string; type?: string }` will be assembled, with the main `src` at the front, followed by the sources from the `<source>` children in their DOM order. Each URL will be normalized using `getAbsoluteURL`.
	4. This array will be passed to the Core SDK.

#### 6.2. Core SDK (`@webspatial/core-sdk`) & Native Bridging

- **JSB Command Update**: The `UpdateSpatializedStatic3DElementProperties` command in `JSBCommand.ts` will be extended to carry the new `sources` property.
	- `sources?: { src: string; type?: string }[]`

- **Core Element (SpatializedStatic3DElement.ts)**: It will simply forward the `sources` array to the native layer via the updated `updateProperties` call. The `ready` promise will now resolve based on the final outcome communicated back from the native layer after it has completed its source selection process.

#### 6.3. Native visionOS Layer (`packages/visionOS`)

- **Model & State**:
	- In `JSBCommand.swift`, `UpdateSpatializedStatic3DElementProperties` will be updated to decode the `sources: [ModelSource]?` array, where `ModelSource` is a new `Decodable` struct: `struct ModelSource: Decodable { let src: String; let type: String?; }`.
	- In `SpatializedStatic3DElement.swift`, new properties will be added: `var sources: [ModelSource] = []` and `var currentSourceIndex: Int = 0`.

- **Source Priority & Loading Logic**: The core responsibility for trying each source lives `SpatializedStatic3DView.swift`.
	1. When the view's properties are updated with a new `sources` list, it will reset `currentSourceIndex` to 0 and begin the loading process.
	2. It will attempt to load the model from `sources[currentSourceIndex].src`. The view will use the `type` attribute to help prioritize or skip formats. On visionOS, sources with type `model/vnd.usdz+zip` will be preferred.
	3. The `Model3D(url:)` initializer will be used.
		- On `.success`, the view will fire a single `modelloaded` event and stop the process.
		- On `.failure`, instead of immediately firing `modelloadfailed`, it will increment `currentSourceIndex`. If there are more sources to try (`currentSourceIndex < sources.count`), it will re-render, triggering an attempt to load the next source.
		- Only after the last source in the array fails will it fire a single, definitive `modelloadfailed` event.
	4. This centralizes the fallback logic natively, making the web implementation cleaner and more declarative.

### 7. Poster Image (`poster="..."`)

A poster image provides immediate visual feedback to the user, filling the component's frame while the 3D model is being fetched and rendered.

#### 7.1. React SDK (`@webspatial/react-sdk`)

- **Prop Handling**: The `<Model>` component will accept a `poster` prop (string URL). The URL will be normalized using `getAbsoluteURL`.

#### 7.2. Native visionOS Layer (`packages/visionOS`)
For a more integrated experience in Spatial Mode, we will handle the poster on the native side.
- **New JSB Command**: A new property will be added to `UpdateSpatializedStatic3DElementProperties` in `JSBCommand.swift` and `JSBCommand.ts`: `posterURL: String?`. The React layer will send this URL along with the initial properties.

- **SwiftUI Implementation**:
	1. The `body` will use a `ZStack`.
	2. The bottom layer of the `ZStack` will be an `AsyncImage(url: URL(string: posterURL))` if `posterURL` is provided. This image will be configured to act as the back-plane of the 3D container.
	4. The top layer will be the `Model3D` view. Its content will be conditionally rendered based on the loading phase.
	6. The `AsyncImage` will be hidden until the model has loaded, using `.opacity(isModelReady ? 0 : 1)`. This ensures a smooth transition where the poster is visible until the model is fully rendered and appears in its place.
	7. This approach ensures the poster is correctly positioned in 3D space as part of the spatial element, rather than being a simple 2D overlay.

### 8. Lazy Loading (`loading="lazy"`) 🚧
Lazy loading will be managed natively to more accurately determine viewport intersection, removing the need for a web-based `IntersectionObserver` and simplifying the React implementation.

#### 8.1. React SDK (`@webspatial/react-sdk`)

- **Prop Forwarding**: The `<Model>` component will accept the `loading?: 'eager' | 'lazy'` prop. This prop will be passed down through `SpatializedStatic3DElementContainer`.

- **No&nbsp;IntersectionObserver**: The previously proposed `useIntersectionLazyLoad` hook and any `IntersectionObserver` logic will be removed entirely from the React SDK for this feature. The component's responsibility is simply to inform the native layer of the desired loading behavior.

#### 8.2. Core SDK (`@webspatial/core-sdk`)

- **JSB Command Update**: The `UpdateSpatializedStatic3DElementProperties` command in `JSBCommand.ts` will be extended to include `loading?: 'eager' | 'lazy'`. This value is forwarded directly to the native layer.

#### 8.3. Native visionOS Layer (`packages/visionOS`)

- **Native Intersection Detection**: The native layer will now be responsible for calculating if the element is visible within the webview's viewport.
	1. **State Management**: `SpatializedStatic3DElement.swift` will store the `loading` mode and a new computed property `var isIntersecting: Bool`.
	2. **Viewport & Scroll Data**: To calculate intersection, we need context from the webview.
		- `SpatialScene.spatialWebViewModel` already exposes `scrollOffset` via its `addScrollUpdateListener`.
		- We will extend `SpatialWebViewModel.swift` to also expose the webview's viewport size. A new method or computed property will be added: `var viewportSize: CGSize { return webview?.scrollView.frame.size ?? .zero }`.
	3. **Intersection Calculation**: With the element's 2D frame (`clientX`, `clientY`, `width`, `height`), the `scrollOffset`, and the `viewportSize`, the native `SpatializedStatic3DElement` can accurately compute if its frame overlaps with the visible area of the webview at any time. This calculation will be triggered whenever a scroll update occurs.
	4. **Gated Model Loading**: In `SpatializedStatic3DView.swift`, the decision to render the `Model3D` will be gated by a condition: `let shouldLoad = spatializedElement.loading == .eager || (spatializedElement.loading == .lazy && spatializedElement.isIntersecting)`.
		- If `shouldLoad` is `false`, the view will render the poster/back-plane or a lightweight placeholder.
		- The model loading process (`Model3D(url:)`) will only be initiated when `shouldLoad` first becomes `true`.
	5. **Scroll Updates**: On each scroll event received from `addScrollUpdateListener`, the `isIntersecting` state for all lazy elements will be re-evaluated. If an element's `isIntersecting` status changes from `false` to `true`, and it hasn't loaded yet, the loading process is triggered.

## Risks
- **Gesture Conflicts**: Our proposed solution of disabling drag listeners when orbit is present is a safe starting point.
- **Safari Alignment**: Since the `<model>` element is still an evolving standard, our implementation is a best-effort interpretation. We must be prepared to adapt as the standard solidifies.
- **Animation State Sync**: Keeping `ref.currentTime` perfectly in sync can be chatty. The proposed `Timer`-based approach is a good start, but we may need to throttle the update frequency to avoid overwhelming the webview bridge.

## References
- [A step into the spatial web: The HTML model element in Apple Vision Pro](https://webkit.org/blog/17118/a-step-into-the-spatial-web-the-html-model-element-in-apple-vision-pro/)
- [model-element/explainer.md at main · immersive-web/model-element](https://github.com/immersive-web/model-element/blob/main/explainer.md#stage-interaction-mode)
- [The `<model>` element](https://immersive-web.github.io/model-element/)
