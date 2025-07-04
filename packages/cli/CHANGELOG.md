# @webspatial/builder

## 1.0.0

### Patch Changes

- 6b84f95: config default manifest params
- 524870a: App names that support uploading contain spaces
- Updated dependencies [251e31f]
- Updated dependencies [fa91d08]
  - @webspatial/platform-visionos@1.0.0

## 0.1.23

### Patch Changes

- Updated dependencies [b9fadd1]
- Updated dependencies [19754cd]
- Updated dependencies [36ee1ba]
  - @webspatial/platform-visionos@0.1.23

## 0.1.22

### Patch Changes

- 10e993a: Adjust the start_url verification logic
  - @webspatial/platform-visionos@0.1.22

## 0.1.21

### Patch Changes

- ac3b3e1: Fix the issue of incorrect scope configuration in offline environment
  - @webspatial/platform-visionos@0.1.21

## 0.1.20

### Patch Changes

- 8a99e49: Inject the version number using the CLI tool instead of loading package.json in native
- c3aa903: Navigation using new style
- dc16c7c: Fixed the issue where the icon under the run command did not meet the requirements and may result in an error
- Updated dependencies [3c4acf0]
- Updated dependencies [8a99e49]
- Updated dependencies [c3aa903]
  - @webspatial/platform-visionos@0.1.20

## 0.1.19

### Patch Changes

- 3c52171: Modify the export path of the test package
  - @webspatial/platform-visionos@0.1.19

## 0.1.18

### Patch Changes

- ec0277b: fix scope setup when the web project is a offline project
- Updated dependencies [bf6f9b3]
- Updated dependencies [db957ab]
- Updated dependencies [46f7f26]
  - @webspatial/platform-visionos@0.1.18

## 0.1.17

### Patch Changes

- 56e6a1d: Fix cli run command repeatedly executed bug
  - @webspatial/platform-visionos@0.1.17

## 0.1.16

### Patch Changes

- Fix parameter parsing error after using commander.js
  - @webspatial/platform-visionos@0.1.16

## 0.1.15

### Patch Changes

- @webspatial/platform-visionos@0.1.15

## 0.1.14

### Patch Changes

- ac63313: Support the use of the -- tryWithoutBuild=true parameter in the run command to bypass compilation and run.
- Updated dependencies [ff647df]
- Updated dependencies [a87c8bf]
- Updated dependencies [1a9e18c]
  - @webspatial/platform-visionos@0.1.14

## 0.1.13

### Patch Changes

- Updated dependencies [1c0709c]
- Updated dependencies [3e0b072]
  - @webspatial/platform-visionos@0.1.13

## 0.1.12

### Patch Changes

- 09fe929: Remove id from default manifest
- 55171c7: Support the launch command, which eliminates the need for compilation to trigger the emulator to open the app
- 0058670: Support shutdown command to close simulator
- Updated dependencies [f6befd2]
  - @webspatial/platform-visionos@0.1.12

## 0.1.11

### Patch Changes

- 310a722: Fix bundleId bug with run command
- 331e2f6: When executing the run command, the default value will be overwritten when --bundle-id is passed in
  - @webspatial/platform-visionos@0.1.11

## 0.1.10

### Patch Changes

- 5b90390: Fix the issue where manifestTemplate.ts is not synchronized with manifest.swift
  - @webspatial/platform-visionos@0.1.10

## 0.1.9

### Patch Changes

- Updated dependencies [51b4e56]
  - @webspatial/platform-visionos@0.1.9

## 0.1.8

### Patch Changes

- 6fa36a0: Add default icon and default start_url, support new displa: fullscreen
- Updated dependencies [4aa5a3b]
  - @webspatial/platform-visionos@0.1.8

## 0.1.7

### Patch Changes

- @webspatial/platform-visionos@0.1.7

## 0.1.6

### Patch Changes

- @webspatial/platform-visionos@0.1.6

## 0.1.5

### Patch Changes

- @webspatial/platform-visionos@0.1.5

## 0.1.4

### Patch Changes

- b1f60f7: Fix run command bug and provides the default export path
  - @webspatial/platform-visionos@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [ab185cf]
- Updated dependencies [9b49c90]
  - @webspatial/platform-visionos@0.1.3

## 0.1.2

### Patch Changes

- @webspatial/platform-visionos@0.1.2

## 0.1.1

### Patch Changes

- c2d4a30: Fix default id setting
  - @webspatial/platform-visionos@0.1.1

## 0.1.0

### Minor Changes

- a2a401e: version bump

### Patch Changes

- 2494201: Fix missing id bug when use run command

## 0.0.20

### Patch Changes

- e3e040a: Fix an error that may occur under the run command regarding the bundle ID, and improve the verification rules for the bundle ID

## 0.0.19

### Patch Changes

- 10c1b8f: Under the run command, when the manifest file is missing, the default manifest can be used instead.

## 0.0.18

### Patch Changes

- f20ded9: Fix --project parameter logic

## 0.0.18-alpha.0

### Patch Changes

- f20ded9: Fix --project parameter logic

## 0.0.17

### Patch Changes

- 3981195: Fix the validation logic when the scope is missing in the manifest

## 0.0.16

### Patch Changes

- 5648ef2: Fix the verification logic of the --base parameter

## 0.0.15

### Patch Changes

- f4c23d9: The default value of the --manifest parameter has been increased to support public/manifest.webmanifest

## 0.0.14

### Patch Changes

- 72973d6: Add readme to package, add --bundle-id parameter to bind the bundle id in xcode.

## 0.0.13

### Patch Changes

- ddab5df: Change --base-url to --base, and optimize the combination logic between --base and start_url

## 0.0.12

### Patch Changes

- abeda99: Change some cli parameters name and change the name of @webspatial/platform-avp to @webspatial/platform-visionos
- 3f0d749: Added basic readme

## 0.0.11

### Patch Changes

- 38aea07: Make the cli tool lighter, and change the dev command to run.
- 50ea768: add getAVPVersionUrl to transform web url to avp version

## 0.0.10

### Patch Changes

- 0d16e4f: support manifest.xr_main_scene="dynamic"

## 0.0.9

### Patch Changes

- 8dc1869: spatial view model rotation example

## 0.0.8

### Patch Changes

- 7c1825b: Update navigation UI and expand animation.

## 0.0.7

### Patch Changes

- update nav layout
- 0138ec0: Optimize the navigation UI and modify the mainScene parameter in the manifest to xr_main_scene

## 0.0.6

### Patch Changes

- 6442bf7: Enhance compatibility of configuration scope

## 0.0.5

### Patch Changes

- cf1fa9e: Update the method for checking start_url and optimize the method of generating bundle IDs based on the IDs in the manifest.

## 0.0.4

### Patch Changes

- 5db4321: Fix dir path & support export param when use build command

## 0.0.3

### Patch Changes

- b890f50: The dev command relaxes the detection criteria.

## 0.0.2

### Patch Changes

- 75d4eab: Supplement packaging information

## 0.0.1

### Patch Changes

- bda4075: Client CLI tool to Generate XRApp project for Apple Vision Pro
