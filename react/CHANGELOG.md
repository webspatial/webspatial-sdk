# @webspatial/react-sdk

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
