# ornament-style-api Specification

## Purpose
Define the React Ornament style API boundary: style applies inside the Ornament child webview, material is configured through `--xr-background-material`, and native host geometry remains explicit component props.

## Requirements
### Requirement: Expose Ornament style as child-webview CSS

The React SDK MUST expose a `style?: React.CSSProperties` prop on `<Ornament />` and MUST apply that style to the Ornament child webview document root.

#### Scenario: Style is applied to Ornament webview html

- **WHEN** application code renders `<Ornament style={style}>{content}</Ornament>` in a supported runtime
- **THEN** the SDK MUST apply `style` to the Ornament child webview `html` element
- **AND** the SDK MUST portal `content` into the Ornament child webview without creating a parent-document DOM host for the Ornament component

#### Scenario: Parent root inline style is not inherited

- **WHEN** the parent page `document.documentElement` has inline style or class values
- **THEN** the SDK MUST NOT copy those parent root inline style or class values onto the Ornament child webview `html` element
- **AND** the Ornament child webview `html` element MUST be styled only by Ornament-controlled defaults and the Ornament `style` prop

#### Scenario: Ordinary CSS affects Ornament content

- **WHEN** `style` contains ordinary CSS properties such as `color`, `padding`, or `background`
- **THEN** those properties MUST be available through the Ornament child webview document root
- **AND** Ornament content MUST be able to inherit or reference those properties according to normal browser CSS behavior inside that child webview

#### Scenario: Removed style keys are cleared

- **WHEN** the `style` prop changes and a previously applied property is no longer present
- **THEN** the SDK MUST remove that property from the Ornament child webview `html` element

### Requirement: Map Ornament material from CSS custom property

The React SDK MUST derive the native Ornament host background material from the `--xr-background-material` CSS custom property in the `style` prop.

#### Scenario: Material is set from style custom property

- **WHEN** application code renders `<Ornament style={{ '--xr-background-material': 'thin' }}>{content}</Ornament>`
- **THEN** the SDK MUST create or update the runtime Ornament with `backgroundMaterial` set to `thin`
- **AND** the `--xr-background-material` property MUST remain applied to the child webview `html` element

#### Scenario: Material update follows style change

- **WHEN** an existing `<Ornament />` changes `style['--xr-background-material']` from one valid value to another
- **THEN** the SDK MUST update the existing runtime Ornament host background material without destroying and recreating the Ornament

#### Scenario: Invalid material falls back through core normalization

- **WHEN** `style['--xr-background-material']` is missing or invalid
- **THEN** the SDK MUST rely on core Ornament option normalization to apply the documented default background material

### Requirement: Keep Ornament host geometry explicit

The React SDK MUST keep native Ornament host geometry and corner clipping as explicit component props rather than CSS layout properties.

#### Scenario: Width and height remain top-level props

- **WHEN** application code renders `<Ornament width={240} height={140}>{content}</Ornament>`
- **THEN** the SDK MUST pass `width` and `height` through the existing core Ornament options
- **AND** the SDK MUST NOT require `style.width` or `style.height` to size the native Ornament host

#### Scenario: Corner radius remains top-level prop

- **WHEN** application code renders `<Ornament cornerRadius={cornerRadius}>{content}</Ornament>`
- **THEN** the SDK MUST pass `cornerRadius` through the existing core Ornament options
- **AND** the SDK MUST NOT require CSS `borderRadius` parsing to configure native Ornament host corner clipping

#### Scenario: CSS geometry does not imply parent layout participation

- **WHEN** `style` contains CSS layout properties such as `width`, `height`, `minWidth`, `maxWidth`, `boxSizing`, `borderRadius`, or `position`
- **THEN** the SDK MUST apply those properties only inside the Ornament child webview CSS environment
- **AND** the SDK MUST NOT create a parent-document layout host or hidden probe to interpret those properties as native Ornament host geometry

### Requirement: Remove React backgroundMaterial prop from public Ornament API

The React SDK MUST replace the public `<Ornament backgroundMaterial={...} />` API with `style={{ '--xr-background-material': ... }}` for React-facing material styling.

#### Scenario: Public API uses style for material

- **WHEN** developers render `<Ornament />`
- **THEN** the supported React-facing public props MUST include `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, `height`, `cornerRadius`, `style`, and `children`
- **AND** React-facing material styling MUST be expressed through `style['--xr-background-material']`

#### Scenario: Core protocol remains unchanged

- **WHEN** the React layer creates or updates a runtime Ornament
- **THEN** it MUST continue to call the existing core Ornament APIs with normalized `backgroundMaterial`, `width`, `height`, and `cornerRadius` options
- **AND** native hosts MUST NOT need protocol changes for this React API adjustment

### Requirement: Update Ornament demo and regression coverage

The SDK MUST update the Ornament demo and tests to cover the style-based React API.

#### Scenario: Demo material control writes style custom property

- **WHEN** the test-server Ornament demo changes the background material control
- **THEN** the rendered `<Ornament />` MUST set `--xr-background-material` through the `style` prop
- **AND** the existing native Ornament host material MUST update to the selected value

#### Scenario: Tests cover ordinary style injection

- **WHEN** automated tests render Ornament with ordinary CSS in `style`
- **THEN** tests MUST verify that the style is applied to the child webview document root
- **AND** tests MUST verify that the React component does not create a parent-document DOM host for style resolution

#### Scenario: AVP simulator screenshot acceptance

- **WHEN** the implementation is validated in the AVP simulator after launching the app to the Ornament demo
- **THEN** validation MUST wait 10 seconds after the app is running
- **AND** validation MUST capture a screenshot that shows the Ornament demo rendered for manual acceptance review
