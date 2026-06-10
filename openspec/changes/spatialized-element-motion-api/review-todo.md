# SpatializedMotionController Review TODO

## Notes

- `[x]` means the decision is confirmed, or the work item is already complete
- `[ ]` means the work is not complete yet, or the issue is still undecided
- Review criterion: consider both the React SDK target API and the Core exported surface, with the React SDK target API taking priority

## Confirmed Decisions

### 1. Remove `nativeControlling`

- [x] Decision confirmed
- [x] Remove `NativePlaybackBackend.nativeControlling`
- [x] Clean up tests that poke this private field
- [x] Rewrite related tests to assert observable behavior instead of mutating private state

### 2. Remove `nativeSessionAnimating`

- [x] Decision confirmed
- [x] Remove `nativeSessionAnimating` from the controller implementation
- [x] Remove `nativeSessionAnimating` from the `SpatializedMotionHandle` interface
- [x] Remove the corresponding field from the no-runtime parity implementation

### 3. Remove `MotionKindPolicy.capabilityToken`

- [x] Decision confirmed
- [x] Remove `capabilityToken` from `MotionKindPolicy`
- [x] Clean up related type definitions and initialization data

### 4. Unify capability mapping in one place

- [x] Decision confirmed
- [x] Keep the default `kind -> capability` mapping in one place inside `core`
- [x] Remove duplicated default capability mapping from the React side
- [x] Ensure normal production flow uses the core default resolver

### 5. Converge legacy `definition` naming to `config`

- [x] Decision confirmed
- [x] Rename the public getter from `definition` to `config`
- [x] Rename the updater from `updateDefinition` to `updateConfig`
- [x] Update affected call sites and test naming together

### 6. Converge naming toward `config`

- [x] Decision confirmed
- [x] Rename `definition`-related naming toward `config`
- [x] Converge `updateDefinition` toward `updateConfig`
- [x] Update affected call sites and test naming together

### 7. Defer `CapabilityResolver` naming cleanup

- [x] Decision confirmed
- [x] Do not treat naming as a primary work item right now
- [x] Keep it as an optional low-priority readability cleanup that does not block this round

### 8. Keep `supportsMotionKind`

- [x] Decision confirmed
- [x] Keep `supportsMotionKind` for now
- [x] Keep its positioning as an injection seam and avoid presenting it as a recommended end-user React SDK API
- [x] Clarify the boundary between test injection and business configuration, with normal production flow continuing to use the core default resolver

### 9. Remove `element.motion(config)`

- [x] Decision confirmed
- [x] Remove `motion(...)` from the `SpatializedElement` abstract contract
- [x] Remove `motion(...)` from `Spatialized2DElement`
- [x] Remove `motion(...)` from `SpatializedStatic3DElement`
- [x] Remove `motion(...)` from `SpatializedDynamic3DElement`
- [x] Remove `element.motion(config)` references from the openspec design docs
- [x] Check whether proposal and task docs also need corresponding cleanup

### 10. Keep `forceNativePlayback`

- [x] Decision confirmed
- [x] Keep `forceNativePlayback` for now
- [x] Re-evaluate its exposure style only if there is a strong reason later
- [x] Avoid positioning it as a recommended end-user React SDK API

### 11. Change `kindOrOptions` to a single options object

- [x] Decision confirmed
- [x] Converge the controller constructor to a single options object shape
- [x] Keep `kind` out of the options object and set it during runtime binding
- [x] Remove the `kindOrOptions` branch parsing logic
- [x] Update affected call sites and tests

### 12. Tighten motion reexports from the React SDK root

- [x] Decision confirmed
- [x] Remove the root-level `SpatializedMotionController` reexport from `packages/react/src/index.ts`
- [x] Remove the root-level `SpatializedMotionHandle` type reexport from `packages/react/src/index.ts`
- [x] Make it explicit that this tightening only targets the React SDK root entry and does not remove core implementation or internal usage
- [x] Update public-entry documentation so it no longer presents these as React SDK root exports

### 13. Tighten exports from the React motion sub-entry

- [x] Decision confirmed
- [x] Remove the `SpatializedMotionController` export from `packages/react/src/spatialized-container/motion/index.ts`
- [x] Remove the `SpatializedMotionHandle` export from `packages/react/src/spatialized-container/motion/index.ts`
- [x] Make it explicit that this tightening only targets the React motion sub-entry exports and does not remove core implementation or React internal usage
- [x] Tighten root-entry and public documentation wording accordingly

### 14. Keep `SpatializedMotionControllerOptions` as a single options container

- [x] Decision confirmed
- [x] Keep controller-related fields in a single options object
- [x] Express field boundaries through naming and exported surface while staying with one options container
- [x] Avoid splitting the options into multiple grouped structures

### 15. Timing constraint for `kind`

- [x] Decision confirmed
- [x] Allow the controller to be constructed without `kind`
- [x] Guarantee that `kind` is set by the binding flow and readable before the backend actually executes playback
- [x] Make this an explicit must-hold constraint in both design and implementation

### 16. Keep the current composite responsibilities of `attachElement(...)` for now

- [x] Decision confirmed
- [x] Keep the current composite responsibilities of `attachElement(...)` for now
- [x] Do not change its potentially auto-triggered behavior after binding in this round
- [x] If responsibility cleanup is needed later, handle the split between binding and triggering as a separate change

### 17. Keep the current semantics of `autoStart` and `pendingPlay` for now

- [x] Decision confirmed
- [x] Keep `autoStart` and `pendingPlay` coexisting for now
- [x] Keep the current post-bind triggering semantics
- [x] If changes are needed later, converge the relationship between these two signals in a separate change

### 18. Keep a `config` getter after naming convergence

- [x] Decision confirmed
- [x] Keep a public read-only getter after the naming converges to `config`
- [x] Keep this conclusion aligned with the earlier naming-convergence decision
- [x] Complete the getter and updater naming convergence together during implementation

## Open Questions

## Remarks

- This document tracks design-review decisions and implementation progress around `SpatializedMotionController`.
- This document does not mean the code has already been updated; checkbox status should be updated as implementation progresses.