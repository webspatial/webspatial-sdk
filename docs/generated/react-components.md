# React Component API (Generated)

> Generated file. Do not edit by hand.

## Model

- Source: `packages/react/src/Model.tsx`
- Props type: `ModelProps`
- Ref type: `SpatializedStatic3DElementRef`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `autoPlay` | `boolean \| undefined` | no |  |  |  |
| `children` | `ReactNode` | no |  |  |  |
| `enable-xr` | `boolean \| undefined` | no |  |  |  |
| `loop` | `boolean \| undefined` | no |  |  |  |
| `spatialEventOptions` | `SpatialEventOptions \| undefined` | no |  |  |  |
| `src` | `string \| undefined` | no |  |  |  |

<details>
<summary>Event props (166)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onError` | `((event: ModelLoadEvent) => void) \| undefined` | no |  |  |  |
| `onLoad` | `((event: ModelLoadEvent) => void) \| undefined` | no |  |  |  |
| `onSpatialDrag` | `((event: SpatialDragEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragEnd` | `((event: SpatialDragEndEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragStart` | `((event: SpatialDragStartEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnify` | `((event: SpatialMagnifyEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnifyEnd` | `((event: SpatialMagnifyEndEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotate` | `((event: SpatialRotateEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotateEnd` | `((event: SpatialRotateEndEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialTap` | `((event: SpatialTapEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onAbort` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAbortCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEnd` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEndCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIteration` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIterationCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStart` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStartCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlur` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlurCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThrough` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThroughCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChange` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChangeCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEnd` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEndCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStart` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStartCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdate` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdateCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenu` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenuCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopy` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopyCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCut` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCutCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrag` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnd` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEndCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnter` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnterCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExit` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExitCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeave` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeaveCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOver` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOverCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStart` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStartCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrop` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDropCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptied` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptiedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncrypted` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncryptedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEnded` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEndedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onErrorCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocus` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocusCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalid` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalidCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDown` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDownCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyPress` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUp` or `onKeyDown` instead |
| `onKeyPressCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUpCapture` or `onKeyDownCapture` instead |
| `onKeyUp` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyUpCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedData` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedDataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadata` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStart` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStartCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDown` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDownCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseEnter` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseLeave` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMove` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMoveCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOut` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOutCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOver` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOverCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUp` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUpCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPaste` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPasteCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPause` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPauseCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlaying` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancel` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancelCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDown` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDownCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerEnter` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerLeave` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMove` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMoveCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOut` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOutCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOver` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOverCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUp` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUpCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgress` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgressCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onReset` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onResetCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScroll` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScrollCapture` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeked` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeking` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelect` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelectCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalled` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalledCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmit` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmitCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspend` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspendCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdate` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdateCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancel` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancelCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEnd` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEndCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMove` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMoveCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStart` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStartCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEnd` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEndCapture` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaiting` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaitingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheel` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheelCapture` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (53)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `about` | `string \| undefined` | no |  |  |  |
| `accessKey` | `string \| undefined` | no |  |  |  |
| `autoCapitalize` | `"off" \| "none" \| "on" \| "sentences" \| "words" \| "characters" \| (string & {}) \| undefined` | no |  |  |  |
| `autoCorrect` | `string \| undefined` | no |  |  |  |
| `autoFocus` | `boolean \| undefined` | no |  |  |  |
| `autoSave` | `string \| undefined` | no |  |  |  |
| `className` | `string \| undefined` | no |  |  |  |
| `color` | `string \| undefined` | no |  |  |  |
| `content` | `string \| undefined` | no |  |  |  |
| `contentEditable` | `Booleanish \| "inherit" \| "plaintext-only" \| undefined` | no |  |  |  |
| `contextMenu` | `string \| undefined` | no |  |  |  |
| `dangerouslySetInnerHTML` | `{ __html: string \| TrustedHTML; } \| undefined` | no |  |  |  |
| `datatype` | `string \| undefined` | no |  |  |  |
| `defaultChecked` | `boolean \| undefined` | no |  |  |  |
| `defaultValue` | `string \| number \| readonly string[] \| undefined` | no |  |  |  |
| `dir` | `string \| undefined` | no |  |  |  |
| `draggable` | `Booleanish \| undefined` | no |  |  |  |
| `enterKeyHint` | `"search" \| "enter" \| "done" \| "go" \| "next" \| "previous" \| "send" \| undefined` | no |  |  |  |
| `exportparts` | `string \| undefined` | no |  |  |  |
| `hidden` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `inlist` | `any` | no |  |  |  |
| `inputMode` | `"search" \| "text" \| "none" \| "tel" \| "url" \| "email" \| "numeric" \| "decimal" \| undefined` | no | Hints at the type of data that might be entered by the user while editing the element or its contents |  |  |
| `is` | `string \| undefined` | no | Specify that a standard HTML element should behave like a defined custom built-in element |  |  |
| `itemID` | `string \| undefined` | no |  |  |  |
| `itemProp` | `string \| undefined` | no |  |  |  |
| `itemRef` | `string \| undefined` | no |  |  |  |
| `itemScope` | `boolean \| undefined` | no |  |  |  |
| `itemType` | `string \| undefined` | no |  |  |  |
| `key` | `Key \| null \| undefined` | no |  |  |  |
| `lang` | `string \| undefined` | no |  |  |  |
| `nonce` | `string \| undefined` | no |  |  |  |
| `part` | `string \| undefined` | no |  |  |  |
| `prefix` | `string \| undefined` | no |  |  |  |
| `property` | `string \| undefined` | no |  |  |  |
| `radioGroup` | `string \| undefined` | no |  |  |  |
| `rel` | `string \| undefined` | no |  |  |  |
| `resource` | `string \| undefined` | no |  |  |  |
| `results` | `number \| undefined` | no |  |  |  |
| `rev` | `string \| undefined` | no |  |  |  |
| `role` | `AriaRole \| undefined` | no |  |  |  |
| `security` | `string \| undefined` | no |  |  |  |
| `slot` | `string \| undefined` | no |  |  |  |
| `spellCheck` | `Booleanish \| undefined` | no |  |  |  |
| `style` | `CSSProperties \| undefined` | no |  |  |  |
| `suppressContentEditableWarning` | `boolean \| undefined` | no |  |  |  |
| `suppressHydrationWarning` | `boolean \| undefined` | no |  |  |  |
| `tabIndex` | `number \| undefined` | no |  |  |  |
| `title` | `string \| undefined` | no |  |  |  |
| `translate` | `"yes" \| "no" \| undefined` | no |  |  |  |
| `typeof` | `string \| undefined` | no |  |  |  |
| `unselectable` | `"off" \| "on" \| undefined` | no |  |  |  |
| `vocab` | `string \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (53)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `aria-activedescendant` | `string \| undefined` | no | Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. |  |  |
| `aria-atomic` | `Booleanish \| undefined` | no | Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. |  |  |
| `aria-autocomplete` | `"none" \| "list" \| "inline" \| "both" \| undefined` | no | Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made. |  |  |
| `aria-braillelabel` | `string \| undefined` | no | Defines a string value that labels the current element, which is intended to be converted into Braille. |  |  |
| `aria-brailleroledescription` | `string \| undefined` | no | Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille. |  |  |
| `aria-busy` | `Booleanish \| undefined` | no |  |  |  |
| `aria-checked` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "checked" state of checkboxes, radio buttons, and other widgets. |  |  |
| `aria-colcount` | `number \| undefined` | no | Defines the total number of columns in a table, grid, or treegrid. |  |  |
| `aria-colindex` | `number \| undefined` | no | Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid. |  |  |
| `aria-colindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-colindex. |  |  |
| `aria-colspan` | `number \| undefined` | no | Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-controls` | `string \| undefined` | no | Identifies the element (or elements) whose contents or presence are controlled by the current element. |  |  |
| `aria-current` | `boolean \| "time" \| "true" \| "false" \| "page" \| "step" \| "location" \| "date" \| undefined` | no | Indicates the element that represents the current item within a container or set of related elements. |  |  |
| `aria-describedby` | `string \| undefined` | no | Identifies the element (or elements) that describes the object. |  |  |
| `aria-description` | `string \| undefined` | no | Defines a string value that describes or annotates the current element. |  |  |
| `aria-details` | `string \| undefined` | no | Identifies the element that provides a detailed, extended description for the object. |  |  |
| `aria-disabled` | `Booleanish \| undefined` | no | Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. |  |  |
| `aria-dropeffect` | `"link" \| "none" \| "copy" \| "execute" \| "move" \| "popup" \| undefined` | no | Indicates what functions can be performed when a dragged object is released on the drop target. |  | in ARIA 1.1 |
| `aria-errormessage` | `string \| undefined` | no | Identifies the element that provides an error message for the object. |  |  |
| `aria-expanded` | `Booleanish \| undefined` | no | Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. |  |  |
| `aria-flowto` | `string \| undefined` | no | Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order. |  |  |
| `aria-grabbed` | `Booleanish \| undefined` | no | Indicates an element's "grabbed" state in a drag-and-drop operation. |  | in ARIA 1.1 |
| `aria-haspopup` | `boolean \| "dialog" \| "menu" \| "true" \| "false" \| "grid" \| "listbox" \| "tree" \| undefined` | no | Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. |  |  |
| `aria-hidden` | `Booleanish \| undefined` | no | Indicates whether the element is exposed to an accessibility API. |  |  |
| `aria-invalid` | `boolean \| "true" \| "false" \| "grammar" \| "spelling" \| undefined` | no | Indicates the entered value does not conform to the format expected by the application. |  |  |
| `aria-keyshortcuts` | `string \| undefined` | no | Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. |  |  |
| `aria-label` | `string \| undefined` | no | Defines a string value that labels the current element. |  |  |
| `aria-labelledby` | `string \| undefined` | no | Identifies the element (or elements) that labels the current element. |  |  |
| `aria-level` | `number \| undefined` | no | Defines the hierarchical level of an element within a structure. |  |  |
| `aria-live` | `"off" \| "assertive" \| "polite" \| undefined` | no | Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. |  |  |
| `aria-modal` | `Booleanish \| undefined` | no | Indicates whether an element is modal when displayed. |  |  |
| `aria-multiline` | `Booleanish \| undefined` | no | Indicates whether a text box accepts multiple lines of input or only a single line. |  |  |
| `aria-multiselectable` | `Booleanish \| undefined` | no | Indicates that the user may select more than one item from the current selectable descendants. |  |  |
| `aria-orientation` | `"horizontal" \| "vertical" \| undefined` | no | Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. |  |  |
| `aria-owns` | `string \| undefined` | no | Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship. |  |  |
| `aria-placeholder` | `string \| undefined` | no | Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value. A hint could be a sample value or a brief description of the expected format. |  |  |
| `aria-posinset` | `number \| undefined` | no | Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-pressed` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "pressed" state of toggle buttons. |  |  |
| `aria-readonly` | `Booleanish \| undefined` | no | Indicates that the element is not editable, but is otherwise operable. |  |  |
| `aria-relevant` | `"text" \| "additions" \| "additions removals" \| "additions text" \| "all" \| "removals" \| "removals additions" \| "removals text" \| "text additions" \| "text removals" \| undefined` | no | Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified. |  |  |
| `aria-required` | `Booleanish \| undefined` | no | Indicates that user input is required on the element before a form may be submitted. |  |  |
| `aria-roledescription` | `string \| undefined` | no | Defines a human-readable, author-localized description for the role of an element. |  |  |
| `aria-rowcount` | `number \| undefined` | no | Defines the total number of rows in a table, grid, or treegrid. |  |  |
| `aria-rowindex` | `number \| undefined` | no | Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid. |  |  |
| `aria-rowindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-rowindex. |  |  |
| `aria-rowspan` | `number \| undefined` | no | Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-selected` | `Booleanish \| undefined` | no | Indicates the current "selected" state of various widgets. |  |  |
| `aria-setsize` | `number \| undefined` | no | Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-sort` | `"none" \| "ascending" \| "descending" \| "other" \| undefined` | no | Indicates if items in a table or grid are sorted in ascending or descending order. |  |  |
| `aria-valuemax` | `number \| undefined` | no | Defines the maximum allowed value for a range widget. |  |  |
| `aria-valuemin` | `number \| undefined` | no | Defines the minimum allowed value for a range widget. |  |  |
| `aria-valuenow` | `number \| undefined` | no | Defines the current value for a range widget. |  |  |
| `aria-valuetext` | `string \| undefined` | no | Defines the human readable text alternative of aria-valuenow for a range widget. |  |  |

</details>

## SpatializedContainer

- Source: `packages/react/src/spatialized-container/SpatializedContainer.tsx`
- Props type: `SpatializedContainerProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `component` | `ElementType` | yes |  |  |  |
| `createSpatializedElement` | `() => Promise<SpatializedElement>` | yes |  |  |  |
| `extraRefProps` | `((domProxy: T) => Record<string, unknown>) \| undefined` | no |  |  |  |
| `getExtraSpatializedElementProperties` | `((computedStyle: CSSStyleDeclaration) => Record<string, any>) \| undefined` | no |  |  |  |
| `inStandardSpatializedContainer` | `boolean \| undefined` | no |  |  |  |
| `spatialEventOptions` | `SpatialEventOptions \| undefined` | no |  |  |  |
| `spatializedContent` | `ElementType` | yes |  |  |  |

<details>
<summary>Event props (164)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onSpatialDrag` | `((event: SpatialDragEvent<T>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragEnd` | `((event: SpatialDragEndEvent<T>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragStart` | `((event: SpatialDragStartEvent<T>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnify` | `((event: SpatialMagnifyEvent<T>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnifyEnd` | `((event: SpatialMagnifyEndEvent<T>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotate` | `((event: SpatialRotateEvent<T>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotateEnd` | `((event: SpatialRotateEndEvent<T>) => void) \| undefined` | no |  |  |  |
| `onSpatialTap` | `((event: SpatialTapEvent<T>) => void) \| undefined` | no |  |  |  |
| `onAbort` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAbortCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEnd` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEndCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIteration` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIterationCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStart` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStartCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlur` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlurCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThrough` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThroughCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChange` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChangeCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEnd` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEndCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStart` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStartCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdate` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdateCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenu` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenuCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopy` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopyCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCut` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCutCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrag` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnd` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEndCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnter` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnterCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExit` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExitCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeave` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeaveCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOver` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOverCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStart` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStartCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrop` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDropCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptied` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptiedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncrypted` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncryptedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEnded` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEndedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onErrorCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocus` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocusCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalid` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalidCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDown` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDownCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyPress` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUp` or `onKeyDown` instead |
| `onKeyPressCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUpCapture` or `onKeyDownCapture` instead |
| `onKeyUp` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyUpCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedData` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedDataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadata` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStart` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStartCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDown` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDownCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseEnter` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseLeave` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMove` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMoveCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOut` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOutCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOver` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOverCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUp` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUpCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPaste` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPasteCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPause` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPauseCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlaying` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancel` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancelCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDown` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDownCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerEnter` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerLeave` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMove` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMoveCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOut` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOutCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOver` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOverCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUp` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUpCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgress` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgressCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onReset` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onResetCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScroll` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScrollCapture` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeked` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeking` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelect` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelectCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalled` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalledCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmit` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmitCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspend` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspendCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdate` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdateCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancel` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancelCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEnd` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEndCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMove` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMoveCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStart` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStartCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEnd` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEndCapture` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaiting` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaitingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheel` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheelCapture` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (54)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `about` | `string \| undefined` | no |  |  |  |
| `accessKey` | `string \| undefined` | no |  |  |  |
| `autoCapitalize` | `"off" \| "none" \| "on" \| "sentences" \| "words" \| "characters" \| (string & {}) \| undefined` | no |  |  |  |
| `autoCorrect` | `string \| undefined` | no |  |  |  |
| `autoFocus` | `boolean \| undefined` | no |  |  |  |
| `autoSave` | `string \| undefined` | no |  |  |  |
| `children` | `ReactNode` | no |  |  |  |
| `className` | `string \| undefined` | no |  |  |  |
| `color` | `string \| undefined` | no |  |  |  |
| `content` | `string \| undefined` | no |  |  |  |
| `contentEditable` | `Booleanish \| "inherit" \| "plaintext-only" \| undefined` | no |  |  |  |
| `contextMenu` | `string \| undefined` | no |  |  |  |
| `dangerouslySetInnerHTML` | `{ __html: string \| TrustedHTML; } \| undefined` | no |  |  |  |
| `datatype` | `string \| undefined` | no |  |  |  |
| `defaultChecked` | `boolean \| undefined` | no |  |  |  |
| `defaultValue` | `string \| number \| readonly string[] \| undefined` | no |  |  |  |
| `dir` | `string \| undefined` | no |  |  |  |
| `draggable` | `Booleanish \| undefined` | no |  |  |  |
| `enterKeyHint` | `"search" \| "enter" \| "done" \| "go" \| "next" \| "previous" \| "send" \| undefined` | no |  |  |  |
| `exportparts` | `string \| undefined` | no |  |  |  |
| `hidden` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `inlist` | `any` | no |  |  |  |
| `inputMode` | `"search" \| "text" \| "none" \| "tel" \| "url" \| "email" \| "numeric" \| "decimal" \| undefined` | no | Hints at the type of data that might be entered by the user while editing the element or its contents |  |  |
| `is` | `string \| undefined` | no | Specify that a standard HTML element should behave like a defined custom built-in element |  |  |
| `itemID` | `string \| undefined` | no |  |  |  |
| `itemProp` | `string \| undefined` | no |  |  |  |
| `itemRef` | `string \| undefined` | no |  |  |  |
| `itemScope` | `boolean \| undefined` | no |  |  |  |
| `itemType` | `string \| undefined` | no |  |  |  |
| `key` | `Key \| null \| undefined` | no |  |  |  |
| `lang` | `string \| undefined` | no |  |  |  |
| `nonce` | `string \| undefined` | no |  |  |  |
| `part` | `string \| undefined` | no |  |  |  |
| `prefix` | `string \| undefined` | no |  |  |  |
| `property` | `string \| undefined` | no |  |  |  |
| `radioGroup` | `string \| undefined` | no |  |  |  |
| `rel` | `string \| undefined` | no |  |  |  |
| `resource` | `string \| undefined` | no |  |  |  |
| `results` | `number \| undefined` | no |  |  |  |
| `rev` | `string \| undefined` | no |  |  |  |
| `role` | `AriaRole \| undefined` | no |  |  |  |
| `security` | `string \| undefined` | no |  |  |  |
| `slot` | `string \| undefined` | no |  |  |  |
| `spellCheck` | `Booleanish \| undefined` | no |  |  |  |
| `style` | `CSSProperties \| undefined` | no |  |  |  |
| `suppressContentEditableWarning` | `boolean \| undefined` | no |  |  |  |
| `suppressHydrationWarning` | `boolean \| undefined` | no |  |  |  |
| `tabIndex` | `number \| undefined` | no |  |  |  |
| `title` | `string \| undefined` | no |  |  |  |
| `translate` | `"yes" \| "no" \| undefined` | no |  |  |  |
| `typeof` | `string \| undefined` | no |  |  |  |
| `unselectable` | `"off" \| "on" \| undefined` | no |  |  |  |
| `vocab` | `string \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (53)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `aria-activedescendant` | `string \| undefined` | no | Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. |  |  |
| `aria-atomic` | `Booleanish \| undefined` | no | Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. |  |  |
| `aria-autocomplete` | `"none" \| "list" \| "inline" \| "both" \| undefined` | no | Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made. |  |  |
| `aria-braillelabel` | `string \| undefined` | no | Defines a string value that labels the current element, which is intended to be converted into Braille. |  |  |
| `aria-brailleroledescription` | `string \| undefined` | no | Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille. |  |  |
| `aria-busy` | `Booleanish \| undefined` | no |  |  |  |
| `aria-checked` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "checked" state of checkboxes, radio buttons, and other widgets. |  |  |
| `aria-colcount` | `number \| undefined` | no | Defines the total number of columns in a table, grid, or treegrid. |  |  |
| `aria-colindex` | `number \| undefined` | no | Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid. |  |  |
| `aria-colindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-colindex. |  |  |
| `aria-colspan` | `number \| undefined` | no | Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-controls` | `string \| undefined` | no | Identifies the element (or elements) whose contents or presence are controlled by the current element. |  |  |
| `aria-current` | `boolean \| "time" \| "true" \| "false" \| "page" \| "step" \| "location" \| "date" \| undefined` | no | Indicates the element that represents the current item within a container or set of related elements. |  |  |
| `aria-describedby` | `string \| undefined` | no | Identifies the element (or elements) that describes the object. |  |  |
| `aria-description` | `string \| undefined` | no | Defines a string value that describes or annotates the current element. |  |  |
| `aria-details` | `string \| undefined` | no | Identifies the element that provides a detailed, extended description for the object. |  |  |
| `aria-disabled` | `Booleanish \| undefined` | no | Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. |  |  |
| `aria-dropeffect` | `"link" \| "none" \| "copy" \| "execute" \| "move" \| "popup" \| undefined` | no | Indicates what functions can be performed when a dragged object is released on the drop target. |  | in ARIA 1.1 |
| `aria-errormessage` | `string \| undefined` | no | Identifies the element that provides an error message for the object. |  |  |
| `aria-expanded` | `Booleanish \| undefined` | no | Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. |  |  |
| `aria-flowto` | `string \| undefined` | no | Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order. |  |  |
| `aria-grabbed` | `Booleanish \| undefined` | no | Indicates an element's "grabbed" state in a drag-and-drop operation. |  | in ARIA 1.1 |
| `aria-haspopup` | `boolean \| "dialog" \| "menu" \| "true" \| "false" \| "grid" \| "listbox" \| "tree" \| undefined` | no | Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. |  |  |
| `aria-hidden` | `Booleanish \| undefined` | no | Indicates whether the element is exposed to an accessibility API. |  |  |
| `aria-invalid` | `boolean \| "true" \| "false" \| "grammar" \| "spelling" \| undefined` | no | Indicates the entered value does not conform to the format expected by the application. |  |  |
| `aria-keyshortcuts` | `string \| undefined` | no | Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. |  |  |
| `aria-label` | `string \| undefined` | no | Defines a string value that labels the current element. |  |  |
| `aria-labelledby` | `string \| undefined` | no | Identifies the element (or elements) that labels the current element. |  |  |
| `aria-level` | `number \| undefined` | no | Defines the hierarchical level of an element within a structure. |  |  |
| `aria-live` | `"off" \| "assertive" \| "polite" \| undefined` | no | Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. |  |  |
| `aria-modal` | `Booleanish \| undefined` | no | Indicates whether an element is modal when displayed. |  |  |
| `aria-multiline` | `Booleanish \| undefined` | no | Indicates whether a text box accepts multiple lines of input or only a single line. |  |  |
| `aria-multiselectable` | `Booleanish \| undefined` | no | Indicates that the user may select more than one item from the current selectable descendants. |  |  |
| `aria-orientation` | `"horizontal" \| "vertical" \| undefined` | no | Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. |  |  |
| `aria-owns` | `string \| undefined` | no | Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship. |  |  |
| `aria-placeholder` | `string \| undefined` | no | Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value. A hint could be a sample value or a brief description of the expected format. |  |  |
| `aria-posinset` | `number \| undefined` | no | Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-pressed` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "pressed" state of toggle buttons. |  |  |
| `aria-readonly` | `Booleanish \| undefined` | no | Indicates that the element is not editable, but is otherwise operable. |  |  |
| `aria-relevant` | `"text" \| "additions" \| "additions removals" \| "additions text" \| "all" \| "removals" \| "removals additions" \| "removals text" \| "text additions" \| "text removals" \| undefined` | no | Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified. |  |  |
| `aria-required` | `Booleanish \| undefined` | no | Indicates that user input is required on the element before a form may be submitted. |  |  |
| `aria-roledescription` | `string \| undefined` | no | Defines a human-readable, author-localized description for the role of an element. |  |  |
| `aria-rowcount` | `number \| undefined` | no | Defines the total number of rows in a table, grid, or treegrid. |  |  |
| `aria-rowindex` | `number \| undefined` | no | Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid. |  |  |
| `aria-rowindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-rowindex. |  |  |
| `aria-rowspan` | `number \| undefined` | no | Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-selected` | `Booleanish \| undefined` | no | Indicates the current "selected" state of various widgets. |  |  |
| `aria-setsize` | `number \| undefined` | no | Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-sort` | `"none" \| "ascending" \| "descending" \| "other" \| undefined` | no | Indicates if items in a table or grid are sorted in ascending or descending order. |  |  |
| `aria-valuemax` | `number \| undefined` | no | Defines the maximum allowed value for a range widget. |  |  |
| `aria-valuemin` | `number \| undefined` | no | Defines the minimum allowed value for a range widget. |  |  |
| `aria-valuenow` | `number \| undefined` | no | Defines the current value for a range widget. |  |  |
| `aria-valuetext` | `string \| undefined` | no | Defines the human readable text alternative of aria-valuenow for a range widget. |  |  |

</details>

## Spatialized2DElementContainer

- Source: `packages/react/src/spatialized-container/Spatialized2DElementContainer.tsx`
- Props type: `Spatialized2DElementContainerProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `component` | `P` | yes |  |  |  |
| `spatialEventOptions` | `SpatialEventOptions \| undefined` | no |  |  |  |

<details>
<summary>Event props (166)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onSpatialDrag` | `((event: SpatialDragEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragEnd` | `((event: SpatialDragEndEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragStart` | `((event: SpatialDragStartEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnify` | `((event: SpatialMagnifyEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnifyEnd` | `((event: SpatialMagnifyEndEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotate` | `((event: SpatialRotateEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotateEnd` | `((event: SpatialRotateEndEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onSpatialTap` | `((event: SpatialTapEvent<HTMLElement>) => void) \| undefined` | no |  |  |  |
| `onAbort` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAbortCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEnd` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEndCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIteration` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIterationCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStart` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStartCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlur` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlurCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThrough` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThroughCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChange` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChangeCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEnd` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEndCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStart` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStartCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdate` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdateCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenu` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenuCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopy` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopyCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCut` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCutCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrag` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnd` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEndCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnter` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnterCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExit` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExitCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeave` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeaveCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOver` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOverCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStart` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStartCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrop` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDropCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptied` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptiedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncrypted` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncryptedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEnded` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEndedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onError` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onErrorCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocus` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocusCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalid` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalidCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDown` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDownCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyPress` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUp` or `onKeyDown` instead |
| `onKeyPressCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUpCapture` or `onKeyDownCapture` instead |
| `onKeyUp` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyUpCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoad` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedData` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedDataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadata` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStart` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStartCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDown` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDownCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseEnter` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseLeave` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMove` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMoveCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOut` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOutCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOver` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOverCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUp` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUpCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPaste` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPasteCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPause` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPauseCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlaying` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancel` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancelCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDown` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDownCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerEnter` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerLeave` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMove` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMoveCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOut` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOutCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOver` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOverCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUp` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUpCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgress` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgressCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onReset` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onResetCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScroll` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScrollCapture` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeked` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeking` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelect` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelectCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalled` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalledCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmit` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmitCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspend` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspendCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdate` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdateCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancel` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancelCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEnd` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEndCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMove` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMoveCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStart` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStartCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEnd` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEndCapture` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaiting` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaitingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheel` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheelCapture` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (55)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `about` | `string \| undefined` | no |  |  |  |
| `accessKey` | `string \| undefined` | no |  |  |  |
| `autoCapitalize` | `"off" \| "none" \| "on" \| "sentences" \| "words" \| "characters" \| (string & {}) \| undefined` | no |  |  |  |
| `autoCorrect` | `string \| undefined` | no |  |  |  |
| `autoFocus` | `boolean \| undefined` | no |  |  |  |
| `autoSave` | `string \| undefined` | no |  |  |  |
| `children` | `ReactNode` | no |  |  |  |
| `className` | `string \| undefined` | no |  |  |  |
| `color` | `string \| undefined` | no |  |  |  |
| `content` | `string \| undefined` | no |  |  |  |
| `contentEditable` | `Booleanish \| "inherit" \| "plaintext-only" \| undefined` | no |  |  |  |
| `contextMenu` | `string \| undefined` | no |  |  |  |
| `dangerouslySetInnerHTML` | `{ __html: string \| TrustedHTML; } \| undefined` | no |  |  |  |
| `datatype` | `string \| undefined` | no |  |  |  |
| `defaultChecked` | `boolean \| undefined` | no |  |  |  |
| `defaultValue` | `string \| number \| readonly string[] \| undefined` | no |  |  |  |
| `dir` | `string \| undefined` | no |  |  |  |
| `draggable` | `Booleanish \| undefined` | no |  |  |  |
| `enterKeyHint` | `"search" \| "enter" \| "done" \| "go" \| "next" \| "previous" \| "send" \| undefined` | no |  |  |  |
| `exportparts` | `string \| undefined` | no |  |  |  |
| `hidden` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `inlist` | `any` | no |  |  |  |
| `inputMode` | `"search" \| "text" \| "none" \| "tel" \| "url" \| "email" \| "numeric" \| "decimal" \| undefined` | no | Hints at the type of data that might be entered by the user while editing the element or its contents |  |  |
| `is` | `string \| undefined` | no | Specify that a standard HTML element should behave like a defined custom built-in element |  |  |
| `itemID` | `string \| undefined` | no |  |  |  |
| `itemProp` | `string \| undefined` | no |  |  |  |
| `itemRef` | `string \| undefined` | no |  |  |  |
| `itemScope` | `boolean \| undefined` | no |  |  |  |
| `itemType` | `string \| undefined` | no |  |  |  |
| `key` | `Key \| null \| undefined` | no |  |  |  |
| `lang` | `string \| undefined` | no |  |  |  |
| `nonce` | `string \| undefined` | no |  |  |  |
| `part` | `string \| undefined` | no |  |  |  |
| `prefix` | `string \| undefined` | no |  |  |  |
| `property` | `string \| undefined` | no |  |  |  |
| `radioGroup` | `string \| undefined` | no |  |  |  |
| `ref` | `((instance: HTMLDivElement \| null) => void) \| RefObject<HTMLDivElement> \| null \| undefined` | no |  |  |  |
| `rel` | `string \| undefined` | no |  |  |  |
| `resource` | `string \| undefined` | no |  |  |  |
| `results` | `number \| undefined` | no |  |  |  |
| `rev` | `string \| undefined` | no |  |  |  |
| `role` | `AriaRole \| undefined` | no |  |  |  |
| `security` | `string \| undefined` | no |  |  |  |
| `slot` | `string \| undefined` | no |  |  |  |
| `spellCheck` | `Booleanish \| undefined` | no |  |  |  |
| `style` | `CSSProperties \| undefined` | no |  |  |  |
| `suppressContentEditableWarning` | `boolean \| undefined` | no |  |  |  |
| `suppressHydrationWarning` | `boolean \| undefined` | no |  |  |  |
| `tabIndex` | `number \| undefined` | no |  |  |  |
| `title` | `string \| undefined` | no |  |  |  |
| `translate` | `"yes" \| "no" \| undefined` | no |  |  |  |
| `typeof` | `string \| undefined` | no |  |  |  |
| `unselectable` | `"off" \| "on" \| undefined` | no |  |  |  |
| `vocab` | `string \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (53)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `aria-activedescendant` | `string \| undefined` | no | Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. |  |  |
| `aria-atomic` | `Booleanish \| undefined` | no | Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. |  |  |
| `aria-autocomplete` | `"none" \| "list" \| "inline" \| "both" \| undefined` | no | Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made. |  |  |
| `aria-braillelabel` | `string \| undefined` | no | Defines a string value that labels the current element, which is intended to be converted into Braille. |  |  |
| `aria-brailleroledescription` | `string \| undefined` | no | Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille. |  |  |
| `aria-busy` | `Booleanish \| undefined` | no |  |  |  |
| `aria-checked` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "checked" state of checkboxes, radio buttons, and other widgets. |  |  |
| `aria-colcount` | `number \| undefined` | no | Defines the total number of columns in a table, grid, or treegrid. |  |  |
| `aria-colindex` | `number \| undefined` | no | Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid. |  |  |
| `aria-colindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-colindex. |  |  |
| `aria-colspan` | `number \| undefined` | no | Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-controls` | `string \| undefined` | no | Identifies the element (or elements) whose contents or presence are controlled by the current element. |  |  |
| `aria-current` | `boolean \| "time" \| "true" \| "false" \| "page" \| "step" \| "location" \| "date" \| undefined` | no | Indicates the element that represents the current item within a container or set of related elements. |  |  |
| `aria-describedby` | `string \| undefined` | no | Identifies the element (or elements) that describes the object. |  |  |
| `aria-description` | `string \| undefined` | no | Defines a string value that describes or annotates the current element. |  |  |
| `aria-details` | `string \| undefined` | no | Identifies the element that provides a detailed, extended description for the object. |  |  |
| `aria-disabled` | `Booleanish \| undefined` | no | Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. |  |  |
| `aria-dropeffect` | `"link" \| "none" \| "copy" \| "execute" \| "move" \| "popup" \| undefined` | no | Indicates what functions can be performed when a dragged object is released on the drop target. |  | in ARIA 1.1 |
| `aria-errormessage` | `string \| undefined` | no | Identifies the element that provides an error message for the object. |  |  |
| `aria-expanded` | `Booleanish \| undefined` | no | Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. |  |  |
| `aria-flowto` | `string \| undefined` | no | Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order. |  |  |
| `aria-grabbed` | `Booleanish \| undefined` | no | Indicates an element's "grabbed" state in a drag-and-drop operation. |  | in ARIA 1.1 |
| `aria-haspopup` | `boolean \| "dialog" \| "menu" \| "true" \| "false" \| "grid" \| "listbox" \| "tree" \| undefined` | no | Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. |  |  |
| `aria-hidden` | `Booleanish \| undefined` | no | Indicates whether the element is exposed to an accessibility API. |  |  |
| `aria-invalid` | `boolean \| "true" \| "false" \| "grammar" \| "spelling" \| undefined` | no | Indicates the entered value does not conform to the format expected by the application. |  |  |
| `aria-keyshortcuts` | `string \| undefined` | no | Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. |  |  |
| `aria-label` | `string \| undefined` | no | Defines a string value that labels the current element. |  |  |
| `aria-labelledby` | `string \| undefined` | no | Identifies the element (or elements) that labels the current element. |  |  |
| `aria-level` | `number \| undefined` | no | Defines the hierarchical level of an element within a structure. |  |  |
| `aria-live` | `"off" \| "assertive" \| "polite" \| undefined` | no | Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. |  |  |
| `aria-modal` | `Booleanish \| undefined` | no | Indicates whether an element is modal when displayed. |  |  |
| `aria-multiline` | `Booleanish \| undefined` | no | Indicates whether a text box accepts multiple lines of input or only a single line. |  |  |
| `aria-multiselectable` | `Booleanish \| undefined` | no | Indicates that the user may select more than one item from the current selectable descendants. |  |  |
| `aria-orientation` | `"horizontal" \| "vertical" \| undefined` | no | Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. |  |  |
| `aria-owns` | `string \| undefined` | no | Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship. |  |  |
| `aria-placeholder` | `string \| undefined` | no | Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value. A hint could be a sample value or a brief description of the expected format. |  |  |
| `aria-posinset` | `number \| undefined` | no | Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-pressed` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "pressed" state of toggle buttons. |  |  |
| `aria-readonly` | `Booleanish \| undefined` | no | Indicates that the element is not editable, but is otherwise operable. |  |  |
| `aria-relevant` | `"text" \| "additions" \| "additions removals" \| "additions text" \| "all" \| "removals" \| "removals additions" \| "removals text" \| "text additions" \| "text removals" \| undefined` | no | Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified. |  |  |
| `aria-required` | `Booleanish \| undefined` | no | Indicates that user input is required on the element before a form may be submitted. |  |  |
| `aria-roledescription` | `string \| undefined` | no | Defines a human-readable, author-localized description for the role of an element. |  |  |
| `aria-rowcount` | `number \| undefined` | no | Defines the total number of rows in a table, grid, or treegrid. |  |  |
| `aria-rowindex` | `number \| undefined` | no | Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid. |  |  |
| `aria-rowindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-rowindex. |  |  |
| `aria-rowspan` | `number \| undefined` | no | Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-selected` | `Booleanish \| undefined` | no | Indicates the current "selected" state of various widgets. |  |  |
| `aria-setsize` | `number \| undefined` | no | Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-sort` | `"none" \| "ascending" \| "descending" \| "other" \| undefined` | no | Indicates if items in a table or grid are sorted in ascending or descending order. |  |  |
| `aria-valuemax` | `number \| undefined` | no | Defines the maximum allowed value for a range widget. |  |  |
| `aria-valuemin` | `number \| undefined` | no | Defines the minimum allowed value for a range widget. |  |  |
| `aria-valuenow` | `number \| undefined` | no | Defines the current value for a range widget. |  |  |
| `aria-valuetext` | `string \| undefined` | no | Defines the human readable text alternative of aria-valuenow for a range widget. |  |  |

</details>

## SpatializedStatic3DElementContainer

- Source: `packages/react/src/spatialized-container/SpatializedStatic3DElementContainer.tsx`
- Props type: `SpatializedStatic3DContainerProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `autoPlay` | `boolean \| undefined` | no |  |  |  |
| `children` | `ReactNode` | no |  |  |  |
| `loop` | `boolean \| undefined` | no |  |  |  |
| `spatialEventOptions` | `SpatialEventOptions \| undefined` | no |  |  |  |
| `src` | `string \| undefined` | no |  |  |  |

<details>
<summary>Event props (166)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onError` | `((event: ModelLoadEvent) => void) \| undefined` | no |  |  |  |
| `onLoad` | `((event: ModelLoadEvent) => void) \| undefined` | no |  |  |  |
| `onSpatialDrag` | `((event: SpatialDragEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragEnd` | `((event: SpatialDragEndEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragStart` | `((event: SpatialDragStartEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnify` | `((event: SpatialMagnifyEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnifyEnd` | `((event: SpatialMagnifyEndEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotate` | `((event: SpatialRotateEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotateEnd` | `((event: SpatialRotateEndEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onSpatialTap` | `((event: SpatialTapEvent<SpatializedStatic3DElementRef>) => void) \| undefined` | no |  |  |  |
| `onAbort` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAbortCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEnd` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEndCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIteration` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIterationCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStart` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStartCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlur` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlurCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThrough` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThroughCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChange` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChangeCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEnd` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEndCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStart` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStartCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdate` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdateCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenu` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenuCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopy` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopyCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCut` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCutCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrag` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnd` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEndCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnter` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnterCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExit` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExitCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeave` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeaveCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOver` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOverCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStart` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStartCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrop` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDropCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptied` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptiedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncrypted` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncryptedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEnded` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEndedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onErrorCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocus` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocusCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalid` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalidCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDown` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDownCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyPress` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUp` or `onKeyDown` instead |
| `onKeyPressCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUpCapture` or `onKeyDownCapture` instead |
| `onKeyUp` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyUpCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedData` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedDataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadata` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStart` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStartCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDown` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDownCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseEnter` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseLeave` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMove` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMoveCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOut` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOutCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOver` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOverCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUp` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUpCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPaste` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPasteCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPause` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPauseCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlaying` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancel` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancelCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDown` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDownCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerEnter` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerLeave` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMove` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMoveCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOut` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOutCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOver` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOverCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUp` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUpCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgress` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgressCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onReset` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onResetCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScroll` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScrollCapture` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeked` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeking` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelect` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelectCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalled` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalledCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmit` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmitCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspend` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspendCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdate` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdateCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancel` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancelCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEnd` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEndCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMove` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMoveCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStart` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStartCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEnd` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEndCapture` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaiting` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaitingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheel` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheelCapture` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (53)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `about` | `string \| undefined` | no |  |  |  |
| `accessKey` | `string \| undefined` | no |  |  |  |
| `autoCapitalize` | `"off" \| "none" \| "on" \| "sentences" \| "words" \| "characters" \| (string & {}) \| undefined` | no |  |  |  |
| `autoCorrect` | `string \| undefined` | no |  |  |  |
| `autoFocus` | `boolean \| undefined` | no |  |  |  |
| `autoSave` | `string \| undefined` | no |  |  |  |
| `className` | `string \| undefined` | no |  |  |  |
| `color` | `string \| undefined` | no |  |  |  |
| `content` | `string \| undefined` | no |  |  |  |
| `contentEditable` | `Booleanish \| "inherit" \| "plaintext-only" \| undefined` | no |  |  |  |
| `contextMenu` | `string \| undefined` | no |  |  |  |
| `dangerouslySetInnerHTML` | `{ __html: string \| TrustedHTML; } \| undefined` | no |  |  |  |
| `datatype` | `string \| undefined` | no |  |  |  |
| `defaultChecked` | `boolean \| undefined` | no |  |  |  |
| `defaultValue` | `string \| number \| readonly string[] \| undefined` | no |  |  |  |
| `dir` | `string \| undefined` | no |  |  |  |
| `draggable` | `Booleanish \| undefined` | no |  |  |  |
| `enterKeyHint` | `"search" \| "enter" \| "done" \| "go" \| "next" \| "previous" \| "send" \| undefined` | no |  |  |  |
| `exportparts` | `string \| undefined` | no |  |  |  |
| `hidden` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `inlist` | `any` | no |  |  |  |
| `inputMode` | `"search" \| "text" \| "none" \| "tel" \| "url" \| "email" \| "numeric" \| "decimal" \| undefined` | no | Hints at the type of data that might be entered by the user while editing the element or its contents |  |  |
| `is` | `string \| undefined` | no | Specify that a standard HTML element should behave like a defined custom built-in element |  |  |
| `itemID` | `string \| undefined` | no |  |  |  |
| `itemProp` | `string \| undefined` | no |  |  |  |
| `itemRef` | `string \| undefined` | no |  |  |  |
| `itemScope` | `boolean \| undefined` | no |  |  |  |
| `itemType` | `string \| undefined` | no |  |  |  |
| `key` | `Key \| null \| undefined` | no |  |  |  |
| `lang` | `string \| undefined` | no |  |  |  |
| `nonce` | `string \| undefined` | no |  |  |  |
| `part` | `string \| undefined` | no |  |  |  |
| `prefix` | `string \| undefined` | no |  |  |  |
| `property` | `string \| undefined` | no |  |  |  |
| `radioGroup` | `string \| undefined` | no |  |  |  |
| `rel` | `string \| undefined` | no |  |  |  |
| `resource` | `string \| undefined` | no |  |  |  |
| `results` | `number \| undefined` | no |  |  |  |
| `rev` | `string \| undefined` | no |  |  |  |
| `role` | `AriaRole \| undefined` | no |  |  |  |
| `security` | `string \| undefined` | no |  |  |  |
| `slot` | `string \| undefined` | no |  |  |  |
| `spellCheck` | `Booleanish \| undefined` | no |  |  |  |
| `style` | `CSSProperties \| undefined` | no |  |  |  |
| `suppressContentEditableWarning` | `boolean \| undefined` | no |  |  |  |
| `suppressHydrationWarning` | `boolean \| undefined` | no |  |  |  |
| `tabIndex` | `number \| undefined` | no |  |  |  |
| `title` | `string \| undefined` | no |  |  |  |
| `translate` | `"yes" \| "no" \| undefined` | no |  |  |  |
| `typeof` | `string \| undefined` | no |  |  |  |
| `unselectable` | `"off" \| "on" \| undefined` | no |  |  |  |
| `vocab` | `string \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (53)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `aria-activedescendant` | `string \| undefined` | no | Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. |  |  |
| `aria-atomic` | `Booleanish \| undefined` | no | Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. |  |  |
| `aria-autocomplete` | `"none" \| "list" \| "inline" \| "both" \| undefined` | no | Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made. |  |  |
| `aria-braillelabel` | `string \| undefined` | no | Defines a string value that labels the current element, which is intended to be converted into Braille. |  |  |
| `aria-brailleroledescription` | `string \| undefined` | no | Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille. |  |  |
| `aria-busy` | `Booleanish \| undefined` | no |  |  |  |
| `aria-checked` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "checked" state of checkboxes, radio buttons, and other widgets. |  |  |
| `aria-colcount` | `number \| undefined` | no | Defines the total number of columns in a table, grid, or treegrid. |  |  |
| `aria-colindex` | `number \| undefined` | no | Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid. |  |  |
| `aria-colindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-colindex. |  |  |
| `aria-colspan` | `number \| undefined` | no | Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-controls` | `string \| undefined` | no | Identifies the element (or elements) whose contents or presence are controlled by the current element. |  |  |
| `aria-current` | `boolean \| "time" \| "true" \| "false" \| "page" \| "step" \| "location" \| "date" \| undefined` | no | Indicates the element that represents the current item within a container or set of related elements. |  |  |
| `aria-describedby` | `string \| undefined` | no | Identifies the element (or elements) that describes the object. |  |  |
| `aria-description` | `string \| undefined` | no | Defines a string value that describes or annotates the current element. |  |  |
| `aria-details` | `string \| undefined` | no | Identifies the element that provides a detailed, extended description for the object. |  |  |
| `aria-disabled` | `Booleanish \| undefined` | no | Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. |  |  |
| `aria-dropeffect` | `"link" \| "none" \| "copy" \| "execute" \| "move" \| "popup" \| undefined` | no | Indicates what functions can be performed when a dragged object is released on the drop target. |  | in ARIA 1.1 |
| `aria-errormessage` | `string \| undefined` | no | Identifies the element that provides an error message for the object. |  |  |
| `aria-expanded` | `Booleanish \| undefined` | no | Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. |  |  |
| `aria-flowto` | `string \| undefined` | no | Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order. |  |  |
| `aria-grabbed` | `Booleanish \| undefined` | no | Indicates an element's "grabbed" state in a drag-and-drop operation. |  | in ARIA 1.1 |
| `aria-haspopup` | `boolean \| "dialog" \| "menu" \| "true" \| "false" \| "grid" \| "listbox" \| "tree" \| undefined` | no | Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. |  |  |
| `aria-hidden` | `Booleanish \| undefined` | no | Indicates whether the element is exposed to an accessibility API. |  |  |
| `aria-invalid` | `boolean \| "true" \| "false" \| "grammar" \| "spelling" \| undefined` | no | Indicates the entered value does not conform to the format expected by the application. |  |  |
| `aria-keyshortcuts` | `string \| undefined` | no | Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. |  |  |
| `aria-label` | `string \| undefined` | no | Defines a string value that labels the current element. |  |  |
| `aria-labelledby` | `string \| undefined` | no | Identifies the element (or elements) that labels the current element. |  |  |
| `aria-level` | `number \| undefined` | no | Defines the hierarchical level of an element within a structure. |  |  |
| `aria-live` | `"off" \| "assertive" \| "polite" \| undefined` | no | Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. |  |  |
| `aria-modal` | `Booleanish \| undefined` | no | Indicates whether an element is modal when displayed. |  |  |
| `aria-multiline` | `Booleanish \| undefined` | no | Indicates whether a text box accepts multiple lines of input or only a single line. |  |  |
| `aria-multiselectable` | `Booleanish \| undefined` | no | Indicates that the user may select more than one item from the current selectable descendants. |  |  |
| `aria-orientation` | `"horizontal" \| "vertical" \| undefined` | no | Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. |  |  |
| `aria-owns` | `string \| undefined` | no | Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship. |  |  |
| `aria-placeholder` | `string \| undefined` | no | Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value. A hint could be a sample value or a brief description of the expected format. |  |  |
| `aria-posinset` | `number \| undefined` | no | Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-pressed` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "pressed" state of toggle buttons. |  |  |
| `aria-readonly` | `Booleanish \| undefined` | no | Indicates that the element is not editable, but is otherwise operable. |  |  |
| `aria-relevant` | `"text" \| "additions" \| "additions removals" \| "additions text" \| "all" \| "removals" \| "removals additions" \| "removals text" \| "text additions" \| "text removals" \| undefined` | no | Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified. |  |  |
| `aria-required` | `Booleanish \| undefined` | no | Indicates that user input is required on the element before a form may be submitted. |  |  |
| `aria-roledescription` | `string \| undefined` | no | Defines a human-readable, author-localized description for the role of an element. |  |  |
| `aria-rowcount` | `number \| undefined` | no | Defines the total number of rows in a table, grid, or treegrid. |  |  |
| `aria-rowindex` | `number \| undefined` | no | Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid. |  |  |
| `aria-rowindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-rowindex. |  |  |
| `aria-rowspan` | `number \| undefined` | no | Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-selected` | `Booleanish \| undefined` | no | Indicates the current "selected" state of various widgets. |  |  |
| `aria-setsize` | `number \| undefined` | no | Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-sort` | `"none" \| "ascending" \| "descending" \| "other" \| undefined` | no | Indicates if items in a table or grid are sorted in ascending or descending order. |  |  |
| `aria-valuemax` | `number \| undefined` | no | Defines the maximum allowed value for a range widget. |  |  |
| `aria-valuemin` | `number \| undefined` | no | Defines the minimum allowed value for a range widget. |  |  |
| `aria-valuenow` | `number \| undefined` | no | Defines the current value for a range widget. |  |  |
| `aria-valuetext` | `string \| undefined` | no | Defines the human readable text alternative of aria-valuenow for a range widget. |  |  |

</details>

## Reality

- Source: `packages/react/src/reality/components/Reality.tsx`
- Props type: `RealityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `spatialEventOptions` | `SpatialEventOptions \| undefined` | no |  |  |  |

<details>
<summary>Event props (166)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onSpatialDrag` | `((event: SpatialDragEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragEnd` | `((event: SpatialDragEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragStart` | `((event: SpatialDragStartEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnify` | `((event: SpatialMagnifyEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnifyEnd` | `((event: SpatialMagnifyEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotate` | `((event: SpatialRotateEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotateEnd` | `((event: SpatialRotateEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialTap` | `((event: SpatialTapEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onAbort` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAbortCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEnd` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationEndCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIteration` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationIterationCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStart` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAnimationStartCapture` | `AnimationEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onAuxClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBeforeInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlur` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onBlurCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThrough` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCanPlayThroughCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChange` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onChangeCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEnd` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionEndCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStart` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionStartCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdate` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCompositionUpdateCapture` | `CompositionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenu` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onContextMenuCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopy` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCopyCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCut` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onCutCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClick` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDoubleClickCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrag` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnd` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEndCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnter` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragEnterCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExit` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragExitCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeave` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragLeaveCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOver` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragOverCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStart` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDragStartCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDrop` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDropCapture` | `DragEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onDurationChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptied` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEmptiedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncrypted` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEncryptedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEnded` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onEndedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onError` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onErrorCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocus` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onFocusCapture` | `FocusEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onGotPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInput` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInputCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalid` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onInvalidCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDown` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyDownCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyPress` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUp` or `onKeyDown` instead |
| `onKeyPressCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  | Use `onKeyUpCapture` or `onKeyDownCapture` instead |
| `onKeyUp` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onKeyUpCapture` | `KeyboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoad` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedData` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedDataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadata` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadedMetadataCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStart` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLoadStartCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onLostPointerCaptureCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDown` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseDownCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseEnter` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseLeave` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMove` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseMoveCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOut` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOutCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOver` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseOverCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUp` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onMouseUpCapture` | `MouseEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPaste` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPasteCapture` | `ClipboardEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPause` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPauseCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlay` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlaying` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPlayingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancel` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerCancelCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDown` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerDownCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerEnter` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerLeave` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMove` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerMoveCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOut` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOutCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOver` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerOverCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUp` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onPointerUpCapture` | `PointerEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgress` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onProgressCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onRateChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onReset` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onResetCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScroll` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onScrollCapture` | `UIEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeked` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekedCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeeking` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSeekingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelect` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSelectCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalled` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onStalledCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmit` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSubmitCapture` | `FormEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspend` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onSuspendCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdate` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTimeUpdateCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancel` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchCancelCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEnd` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchEndCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMove` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchMoveCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStart` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTouchStartCapture` | `TouchEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEnd` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onTransitionEndCapture` | `TransitionEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChange` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onVolumeChangeCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaiting` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWaitingCapture` | `ReactEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheel` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |
| `onWheelCapture` | `WheelEventHandler<HTMLDivElement> \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (55)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `about` | `string \| undefined` | no |  |  |  |
| `accessKey` | `string \| undefined` | no |  |  |  |
| `autoCapitalize` | `"off" \| "none" \| "on" \| "sentences" \| "words" \| "characters" \| (string & {}) \| undefined` | no |  |  |  |
| `autoCorrect` | `string \| undefined` | no |  |  |  |
| `autoFocus` | `boolean \| undefined` | no |  |  |  |
| `autoSave` | `string \| undefined` | no |  |  |  |
| `children` | `ReactNode` | no |  |  |  |
| `className` | `string \| undefined` | no |  |  |  |
| `color` | `string \| undefined` | no |  |  |  |
| `content` | `string \| undefined` | no |  |  |  |
| `contentEditable` | `Booleanish \| "inherit" \| "plaintext-only" \| undefined` | no |  |  |  |
| `contextMenu` | `string \| undefined` | no |  |  |  |
| `dangerouslySetInnerHTML` | `{ __html: string \| TrustedHTML; } \| undefined` | no |  |  |  |
| `datatype` | `string \| undefined` | no |  |  |  |
| `defaultChecked` | `boolean \| undefined` | no |  |  |  |
| `defaultValue` | `string \| number \| readonly string[] \| undefined` | no |  |  |  |
| `dir` | `string \| undefined` | no |  |  |  |
| `draggable` | `Booleanish \| undefined` | no |  |  |  |
| `enterKeyHint` | `"search" \| "enter" \| "done" \| "go" \| "next" \| "previous" \| "send" \| undefined` | no |  |  |  |
| `exportparts` | `string \| undefined` | no |  |  |  |
| `hidden` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `inlist` | `any` | no |  |  |  |
| `inputMode` | `"search" \| "text" \| "none" \| "tel" \| "url" \| "email" \| "numeric" \| "decimal" \| undefined` | no | Hints at the type of data that might be entered by the user while editing the element or its contents |  |  |
| `is` | `string \| undefined` | no | Specify that a standard HTML element should behave like a defined custom built-in element |  |  |
| `itemID` | `string \| undefined` | no |  |  |  |
| `itemProp` | `string \| undefined` | no |  |  |  |
| `itemRef` | `string \| undefined` | no |  |  |  |
| `itemScope` | `boolean \| undefined` | no |  |  |  |
| `itemType` | `string \| undefined` | no |  |  |  |
| `key` | `Key \| null \| undefined` | no |  |  |  |
| `lang` | `string \| undefined` | no |  |  |  |
| `nonce` | `string \| undefined` | no |  |  |  |
| `part` | `string \| undefined` | no |  |  |  |
| `prefix` | `string \| undefined` | no |  |  |  |
| `property` | `string \| undefined` | no |  |  |  |
| `radioGroup` | `string \| undefined` | no |  |  |  |
| `ref` | `((instance: HTMLDivElement \| null) => void) \| RefObject<HTMLDivElement> \| null \| undefined` | no |  |  |  |
| `rel` | `string \| undefined` | no |  |  |  |
| `resource` | `string \| undefined` | no |  |  |  |
| `results` | `number \| undefined` | no |  |  |  |
| `rev` | `string \| undefined` | no |  |  |  |
| `role` | `AriaRole \| undefined` | no |  |  |  |
| `security` | `string \| undefined` | no |  |  |  |
| `slot` | `string \| undefined` | no |  |  |  |
| `spellCheck` | `Booleanish \| undefined` | no |  |  |  |
| `style` | `CSSProperties \| undefined` | no |  |  |  |
| `suppressContentEditableWarning` | `boolean \| undefined` | no |  |  |  |
| `suppressHydrationWarning` | `boolean \| undefined` | no |  |  |  |
| `tabIndex` | `number \| undefined` | no |  |  |  |
| `title` | `string \| undefined` | no |  |  |  |
| `translate` | `"yes" \| "no" \| undefined` | no |  |  |  |
| `typeof` | `string \| undefined` | no |  |  |  |
| `unselectable` | `"off" \| "on" \| undefined` | no |  |  |  |
| `vocab` | `string \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (53)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `aria-activedescendant` | `string \| undefined` | no | Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. |  |  |
| `aria-atomic` | `Booleanish \| undefined` | no | Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. |  |  |
| `aria-autocomplete` | `"none" \| "list" \| "inline" \| "both" \| undefined` | no | Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made. |  |  |
| `aria-braillelabel` | `string \| undefined` | no | Defines a string value that labels the current element, which is intended to be converted into Braille. |  |  |
| `aria-brailleroledescription` | `string \| undefined` | no | Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille. |  |  |
| `aria-busy` | `Booleanish \| undefined` | no |  |  |  |
| `aria-checked` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "checked" state of checkboxes, radio buttons, and other widgets. |  |  |
| `aria-colcount` | `number \| undefined` | no | Defines the total number of columns in a table, grid, or treegrid. |  |  |
| `aria-colindex` | `number \| undefined` | no | Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid. |  |  |
| `aria-colindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-colindex. |  |  |
| `aria-colspan` | `number \| undefined` | no | Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-controls` | `string \| undefined` | no | Identifies the element (or elements) whose contents or presence are controlled by the current element. |  |  |
| `aria-current` | `boolean \| "time" \| "true" \| "false" \| "page" \| "step" \| "location" \| "date" \| undefined` | no | Indicates the element that represents the current item within a container or set of related elements. |  |  |
| `aria-describedby` | `string \| undefined` | no | Identifies the element (or elements) that describes the object. |  |  |
| `aria-description` | `string \| undefined` | no | Defines a string value that describes or annotates the current element. |  |  |
| `aria-details` | `string \| undefined` | no | Identifies the element that provides a detailed, extended description for the object. |  |  |
| `aria-disabled` | `Booleanish \| undefined` | no | Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. |  |  |
| `aria-dropeffect` | `"link" \| "none" \| "copy" \| "execute" \| "move" \| "popup" \| undefined` | no | Indicates what functions can be performed when a dragged object is released on the drop target. |  | in ARIA 1.1 |
| `aria-errormessage` | `string \| undefined` | no | Identifies the element that provides an error message for the object. |  |  |
| `aria-expanded` | `Booleanish \| undefined` | no | Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. |  |  |
| `aria-flowto` | `string \| undefined` | no | Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order. |  |  |
| `aria-grabbed` | `Booleanish \| undefined` | no | Indicates an element's "grabbed" state in a drag-and-drop operation. |  | in ARIA 1.1 |
| `aria-haspopup` | `boolean \| "dialog" \| "menu" \| "true" \| "false" \| "grid" \| "listbox" \| "tree" \| undefined` | no | Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. |  |  |
| `aria-hidden` | `Booleanish \| undefined` | no | Indicates whether the element is exposed to an accessibility API. |  |  |
| `aria-invalid` | `boolean \| "true" \| "false" \| "grammar" \| "spelling" \| undefined` | no | Indicates the entered value does not conform to the format expected by the application. |  |  |
| `aria-keyshortcuts` | `string \| undefined` | no | Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. |  |  |
| `aria-label` | `string \| undefined` | no | Defines a string value that labels the current element. |  |  |
| `aria-labelledby` | `string \| undefined` | no | Identifies the element (or elements) that labels the current element. |  |  |
| `aria-level` | `number \| undefined` | no | Defines the hierarchical level of an element within a structure. |  |  |
| `aria-live` | `"off" \| "assertive" \| "polite" \| undefined` | no | Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. |  |  |
| `aria-modal` | `Booleanish \| undefined` | no | Indicates whether an element is modal when displayed. |  |  |
| `aria-multiline` | `Booleanish \| undefined` | no | Indicates whether a text box accepts multiple lines of input or only a single line. |  |  |
| `aria-multiselectable` | `Booleanish \| undefined` | no | Indicates that the user may select more than one item from the current selectable descendants. |  |  |
| `aria-orientation` | `"horizontal" \| "vertical" \| undefined` | no | Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. |  |  |
| `aria-owns` | `string \| undefined` | no | Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship. |  |  |
| `aria-placeholder` | `string \| undefined` | no | Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value. A hint could be a sample value or a brief description of the expected format. |  |  |
| `aria-posinset` | `number \| undefined` | no | Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-pressed` | `boolean \| "true" \| "false" \| "mixed" \| undefined` | no | Indicates the current "pressed" state of toggle buttons. |  |  |
| `aria-readonly` | `Booleanish \| undefined` | no | Indicates that the element is not editable, but is otherwise operable. |  |  |
| `aria-relevant` | `"text" \| "additions" \| "additions removals" \| "additions text" \| "all" \| "removals" \| "removals additions" \| "removals text" \| "text additions" \| "text removals" \| undefined` | no | Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified. |  |  |
| `aria-required` | `Booleanish \| undefined` | no | Indicates that user input is required on the element before a form may be submitted. |  |  |
| `aria-roledescription` | `string \| undefined` | no | Defines a human-readable, author-localized description for the role of an element. |  |  |
| `aria-rowcount` | `number \| undefined` | no | Defines the total number of rows in a table, grid, or treegrid. |  |  |
| `aria-rowindex` | `number \| undefined` | no | Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid. |  |  |
| `aria-rowindextext` | `string \| undefined` | no | Defines a human readable text alternative of aria-rowindex. |  |  |
| `aria-rowspan` | `number \| undefined` | no | Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid. |  |  |
| `aria-selected` | `Booleanish \| undefined` | no | Indicates the current "selected" state of various widgets. |  |  |
| `aria-setsize` | `number \| undefined` | no | Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. |  |  |
| `aria-sort` | `"none" \| "ascending" \| "descending" \| "other" \| undefined` | no | Indicates if items in a table or grid are sorted in ascending or descending order. |  |  |
| `aria-valuemax` | `number \| undefined` | no | Defines the maximum allowed value for a range widget. |  |  |
| `aria-valuemin` | `number \| undefined` | no | Defines the minimum allowed value for a range widget. |  |  |
| `aria-valuenow` | `number \| undefined` | no | Defines the current value for a range widget. |  |  |
| `aria-valuetext` | `string \| undefined` | no | Defines the human readable text alternative of aria-valuenow for a range widget. |  |  |

</details>

## SceneGraph

- Source: `packages/react/src/reality/components/SceneGraph.tsx`
- Props type: `SceneGraphProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (0)</summary>

_None._

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## Entity

- Source: `packages/react/src/reality/components/Entity.tsx`
- Props type: `EntityComponentProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (0)</summary>

_None._

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## GeometryEntity

- Source: `packages/react/src/reality/components/GeometryEntity.tsx`
- Props type: `GeometryEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `createGeometry` | `(options: any) => Promise<SpatialGeometry>` | yes |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `geometryOptions` | `any` | yes |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `materials` | `string[] \| undefined` | no |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |
| `spatialEventOptions` | `SpatialEventOptions \| undefined` | no |  |  |  |

<details>
<summary>Event props (8)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onSpatialDrag` | `((event: SpatialDragEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragEnd` | `((event: SpatialDragEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragStart` | `((event: SpatialDragStartEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnify` | `((event: SpatialMagnifyEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnifyEnd` | `((event: SpatialMagnifyEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotate` | `((event: SpatialRotateEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotateEnd` | `((event: SpatialRotateEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialTap` | `((event: SpatialTapEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (0)</summary>

_None._

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## BoxEntity

- Source: `packages/react/src/reality/components/BoxEntity.tsx`
- Props type: `BoxEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `materials` | `string[] \| undefined` | no |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (5)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `cornerRadius` | `number \| undefined` | no |  |  |  |
| `depth` | `number \| undefined` | no |  |  |  |
| `height` | `number \| undefined` | no |  |  |  |
| `splitFaces` | `boolean \| undefined` | no |  |  |  |
| `width` | `number \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## SphereEntity

- Source: `packages/react/src/reality/components/SphereEntity.tsx`
- Props type: `SphereEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `materials` | `string[] \| undefined` | no |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (1)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `radius` | `number \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## ConeEntity

- Source: `packages/react/src/reality/components/ConeEntity.tsx`
- Props type: `ConeEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `materials` | `string[] \| undefined` | no |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (2)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `height` | `number \| undefined` | no |  |  |  |
| `radius` | `number \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## CylinderEntity

- Source: `packages/react/src/reality/components/CylinderEntity.tsx`
- Props type: `CylinderEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `materials` | `string[] \| undefined` | no |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (2)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `height` | `number \| undefined` | no |  |  |  |
| `radius` | `number \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## PlaneEntity

- Source: `packages/react/src/reality/components/PlaneEntity.tsx`
- Props type: `PlaneEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `materials` | `string[] \| undefined` | no |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (3)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `cornerRadius` | `number \| undefined` | no |  |  |  |
| `height` | `number \| undefined` | no |  |  |  |
| `width` | `number \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## ModelEntity

- Source: `packages/react/src/reality/components/ModelEntity.tsx`
- Props type: `ModelEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `enableInput` | `boolean \| undefined` | no |  |  |  |
| `id` | `string \| undefined` | no |  |  |  |
| `materials` | `string[] \| undefined` | no |  |  |  |
| `model` | `string` | yes |  |  |  |
| `name` | `string \| undefined` | no |  |  |  |
| `position` | `Vec3 \| undefined` | no |  |  |  |
| `rotation` | `Vec3 \| undefined` | no |  |  |  |
| `scale` | `Vec3 \| undefined` | no |  |  |  |
| `spatialEventOptions` | `SpatialEventOptions \| undefined` | no |  |  |  |

<details>
<summary>Event props (8)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onSpatialDrag` | `((event: SpatialDragEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragEnd` | `((event: SpatialDragEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialDragStart` | `((event: SpatialDragStartEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnify` | `((event: SpatialMagnifyEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialMagnifyEnd` | `((event: SpatialMagnifyEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotate` | `((event: SpatialRotateEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialRotateEnd` | `((event: SpatialRotateEndEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |
| `onSpatialTap` | `((event: SpatialTapEntityEvent<EntityRefShape>) => void) \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (0)</summary>

_None._

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## ModelAsset

- Source: `packages/react/src/reality/components/ModelAsset.tsx`
- Props type: `ModelAssetProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `id` | `string` | yes |  |  |  |
| `src` | `string` | yes |  |  |  |

<details>
<summary>Event props (2)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `onError` | `((error: any) => void) \| undefined` | no |  |  |  |
| `onLoad` | `(() => void) \| undefined` | no |  |  |  |

</details>

<details>
<summary>DOM props (0)</summary>

_None._

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## AttachmentEntity

- Source: `packages/react/src/reality/components/AttachmentEntity.tsx`
- Props type: `AttachmentEntityProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `attachment` | `string` | yes |  |  |  |
| `position` | `[number, number, number] \| undefined` | no |  |  |  |
| `size` | `{ width: number; height: number; }` | yes |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (0)</summary>

_None._

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## AttachmentAsset

- Source: `packages/react/src/reality/components/AttachmentAsset.tsx`
- Props type: `AttachmentAssetProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `name` | `string` | yes |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (0)</summary>

_None._

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## UnlitMaterial

- Source: `packages/react/src/reality/components/UnlitMaterial.tsx`
- Props type: `UnlitMaterialProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `id` | `string` | yes |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (4)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `color` | `string \| undefined` | no |  |  |  |
| `opacity` | `number \| undefined` | no |  |  |  |
| `textureId` | `string \| undefined` | no |  |  |  |
| `transparent` | `boolean \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## Material

- Source: `packages/react/src/reality/components/Material.tsx`
- Props type: `MaterialProps`

### Custom props

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |  |  |
| `id` | `string` | yes |  |  |  |
| `type` | `"unlit"` | yes |  |  |  |

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (4)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `color` | `string \| undefined` | no |  |  |  |
| `opacity` | `number \| undefined` | no |  |  |  |
| `textureId` | `string \| undefined` | no |  |  |  |
| `transparent` | `boolean \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## SSRProvider

- Source: `packages/react/src/ssr/SSRContext.tsx`
- Props type: `SSRProviderProps`

### Custom props

_None._

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (2)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `children` | `ReactNode` | yes |  |  |  |
| `isSSR` | `boolean \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

## SpatialMonitor

- Source: `packages/react/src/spatialized-container-monitor/SpatialMonitor.tsx`
- Props type: `SpatialMonitorProps`

Component that add MutationObserver to monitor all dom changes including its children.
If any dom changes, it will notify all SpatialDiv to render again for the purpose of sync standInstance layout to portalInstance.

### Custom props

_None._

<details>
<summary>Event props (0)</summary>

_None._

</details>

<details>
<summary>DOM props (1)</summary>

| Prop | Type | Required | Description | Default | Deprecated |
| --- | --- | --- | --- | --- | --- |
| `El` | `ElementType \| undefined` | no |  |  |  |

</details>

<details>
<summary>ARIA props (0)</summary>

_None._

</details>

