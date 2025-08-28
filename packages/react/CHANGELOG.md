# @webspatial/react-sdk

## 1.0.2

### Patch Changes

- a45aabd: fix spatialDiv a link should change the main window url and support nested
  - @webspatial/core-sdk@1.0.2

- 94e2e0d0: fix: scene hook param

## 1.0.1

### Patch Changes

- @webspatial/core-sdk@1.0.1

## 1.0.0

### Patch Changes

- 4dc56c3: fix bug: when refresh page in safari tool, the page may be invisible occasionally
- Updated dependencies [bfb72fc]
- Updated dependencies [bc1fcc1]
  - @webspatial/core-sdk@1.0.0

## 0.1.23

### Patch Changes

- Updated dependencies [3a42a35]
  - @webspatial/core-sdk@0.1.23

## 0.1.22

### Patch Changes

- @webspatial/core-sdk@0.1.22

## 0.1.21

### Patch Changes

- @webspatial/core-sdk@0.1.21

## 0.1.20

### Patch Changes

- @webspatial/core-sdk@0.1.20

## 0.1.19

### Patch Changes

- ec06fc2: set spatialdiv portalinstance body background transparent
  - @webspatial/core-sdk@0.1.19

## 0.1.18

### Patch Changes

- 126c45a: check html spatial style when html className changed
  - @webspatial/core-sdk@0.1.18

## 0.1.17

### Patch Changes

- 2a6ba54: set spatialdiv's css transform to 'translateZ(0)' if transform value …
- dbea2f0: add type declare for style.enableXr
- 3db2b7b: export type WindowContainerOptions
  - @webspatial/core-sdk@0.1.17

## 0.1.16

### Patch Changes

- @webspatial/core-sdk@0.1.16

## 0.1.15

### Patch Changes

- 5b72246: export dts for window.xrCurrentSceneDefaults
  - @webspatial/core-sdk@0.1.15

## 0.1.14

### Patch Changes

- Updated dependencies [a87c8bf]
- Updated dependencies [1a9e18c]
  - @webspatial/core-sdk@0.1.14

## 0.1.13

### Patch Changes

- 208e5b4: sync css style display property to portal div
- 0cfd93d: export version from react-sdk
- cc59fbf: export model type
- e10a722: add **webspatialsdk** banner for jsx-runtime
- Updated dependencies [bc93209]
- Updated dependencies [1c0709c]
- Updated dependencies [3e0b072]
  - @webspatial/core-sdk@0.1.13

## 0.1.12

### Patch Changes

- 16e9be0: fix scene polyfill module reset
- Updated dependencies [f6befd2]
  - @webspatial/core-sdk@0.1.12

## 0.1.11

### Patch Changes

- cd50d6b: separate avp and web version by ext filename instead of **WEB**
- 56f32c3: fix a link handling error
- Updated dependencies [6cc8bef]
  - @webspatial/core-sdk@0.1.11

## 0.1.10

### Patch Changes

- 2ea77fd: fix: restore empty module replacement when building web version
- f93d6cc: when global style changes, html material should change according to the new material value
- 900e704: add xr css type declare
  - @webspatial/core-sdk@0.1.10

## 0.1.9

### Patch Changes

- @webspatial/core-sdk@0.1.9

## 0.1.8

### Patch Changes

- 7c8c556: support css hot reload
- Updated dependencies [5be664b]
  - @webspatial/core-sdk@0.1.8

## 0.1.7

### Patch Changes

- cb92fab: fix portalinstance layout issue
- d2ff8ef: fix sub portal instance layout bug
- Updated dependencies [123ee60]
  - @webspatial/core-sdk@0.1.7

## 0.1.6

### Patch Changes

- df94278: bugfix: use useState instead of useRef
  - @webspatial/core-sdk@0.1.6

## 0.1.5

### Patch Changes

- 3b65e89: fix placeholder not displaying when using the model-viewer fallback
  - @webspatial/core-sdk@0.1.5

## 0.1.4

### Patch Changes

- 77c2df3: support --xr-z-index
- 243d190: 1. portalinstance body's size should be the size of children
  - @webspatial/core-sdk@0.1.4

## 0.1.3

### Patch Changes

- deb60e1: update dts for '--xr-background-material' and '--xr-back'
  - @webspatial/core-sdk@0.1.3

## 0.1.2

### Patch Changes

- 99ebe7e: provide warning and failed load event if model-viewer script is missing
  - @webspatial/core-sdk@0.1.2

## 0.1.1

### Patch Changes

- c2d4a30: add JSX namespace
  - @webspatial/core-sdk@0.1.1

## 0.1.0

### Minor Changes

- fe1e2ab: add react-server export for jsx-runtime
- a2a401e: version bump

### Patch Changes

- Updated dependencies [a2a401e]
  - @webspatial/core-sdk@0.1.0

## 0.0.18

### Patch Changes

- f102c02: set model's scrollWithParent property

## 0.0.17

### Patch Changes

- bf0ad9a: keep css in portalInstance the same order as in entry page
- bba3767: SpatialDiv's default material should be none material

## 0.0.16

### Patch Changes

- b1e16b5: only root spatialdiv need to consume window.scrollY
- 997d398: support fixed position for Model including wrapped under a spatialdiv
- 4d95b2b: when model3d is in nested spatialdiv, there's no need to consume window.scrollY
- Updated dependencies [997d398]
  - @webspatial/core-sdk@0.0.4

## 0.0.16-alpha.1

### Patch Changes

- 997d398: support fixed position for Model including wrapped under a spatialdiv
- Updated dependencies [997d398]
  - @webspatial/core-sdk@0.0.4-alpha.0

## 0.0.16-alpha.0

### Patch Changes

- b1e16b5: only root spatialdiv need to consume window.scrollY
- 4d95b2b: when model3d is in nested spatialdiv, there's no need to consume window.scrollY

## 0.0.15

### Patch Changes

- 6d619c9: set portalinstance body have inline-block display, so that body's width/height is determined by spatialdiv

## 0.0.14

### Patch Changes

- Updated dependencies [ee36e07]
  - @webspatial/core-sdk@0.0.3

## 0.0.13

### Patch Changes

- cb34f1d: support css position fixed property in nested spatialdiv
- aa894ba: Support position fix in nested spatialdiv

## 0.0.12

### Patch Changes

- Updated dependencies [d15b125]
  - @webspatial/core-sdk@0.0.2

## 0.0.11

### Patch Changes

- 456d15f: change ModelDragEvent to SpatialModelDragEvent in coresdk
- 9fe84e4: support 'enable-xr-monitor' property which is used to monitor childre…
- c597a16: simplify react-sdk export entries. Remove cjs output.
- Updated dependencies [456d15f]
  - @webspatial/core-sdk@0.0.1

## 0.0.10

### Patch Changes

- f0da37e: more strict model source validation
- 4d727ab: set @webspatial/core-sdk as peerdep

## 0.0.9

### Patch Changes

- 2bb9cfc: when load failure occurs, we should fire an onLoad event with ready: …

## 0.0.8

### Patch Changes

- 193427e: monitor exteral stylesheet change in html header
- c1e7126: sync html className to PortalInstance

## 0.0.7

### Patch Changes

- 7c01263: hide placeholder in sub portalinstance
- 2641c6c: jsx runtime should external react-sdk
- 155300b: Fix scene api support in portalInstance
- 2e2bc94: fix model position calculation error
- 2b4e19b: fix: Resizing webpage seems to cause issues with <Model> #369

## 0.0.6

### Patch Changes

- d47def5: fix define data type error

## 0.0.5

### Patch Changes

- 0eded09: react-sdk ship both esm/cjs,vite plugin use resolve instead of cjs entry

## 0.0.4

### Patch Changes

- 511d42b: support css fixed position for SpatialDiv
- e3aabbd: check DOMContentLoaded in more robust way
- Updated dependencies [511d42b]
- Updated dependencies [e3aabbd]
  - @webspatial/react-sdk@0.0.4

## 0.0.3

### Patch Changes

- 0b74270: let process.env.xrEnv default to not avp
- Updated dependencies [0b74270]
  - @webspatial/react-sdk@0.0.3

## 0.0.2

### Patch Changes

- 7493c5a: add ts for vite plugin
- 8bbb490: update peerDeps version to >=18
- Updated dependencies [7493c5a]
- Updated dependencies [8bbb490]
  - @webspatial/react-sdk@0.0.2

## 0.0.1

### Patch Changes

- 1a6fb29: update description
- Updated dependencies [1a6fb29]
  - @webspatial/react-sdk@0.0.1
