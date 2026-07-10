## 1. Proposal Alignment

- [ ] 1.1 Review the legacy `add-entity-transform-animation` artifacts and mark the exact behaviors that are superseded by this new target state
- [ ] 1.2 Review `spatialized-element-motion-api` references to Entity motion and align wording so the new Entity proposal is the authoritative target state
- [ ] 1.3 Remove `supports('useEntityAnimation', ['entity'])` from this proposal's documented contract and reserved sub-tokens; coordinate any `spatialized-element-motion-api` wording separately instead of changing it in this proposal pass

## 2. Type and Contract Redesign

- [ ] 2.1 Add failing tests for the new `useEntityAnimation` tuple shape `[animation, api, entityProps]`
- [ ] 2.2 Redesign Core and React type surfaces for Entity motion config authored as `position` / `rotation` / `scale` and transform-only callback values
- [ ] 2.3 Add failing tests for legacy config rejection and unsupported targets such as `opacity`
- [ ] 2.4 Define the public playback surface (`play`, `pause`, `resume`, `stop`, `reset`, `finish`) and the `api.set` state setter that only accepts an `EntityMotionProps` patch object, documenting `api.set` as a state setter rather than a playback command

## 3. Entity Binding Migration

- [ ] 3.1 Add failing tests proving Entity motion binds through the `animation` prop
- [ ] 3.2 Update Entity prop contracts and binding lifecycle to use the new Entity motion binding path
- [ ] 3.3 Preserve the single-binding invariant so one animation object cannot drive multiple Entity instances
- [ ] 3.4 Document `animation` as the Entity motion binding
- [ ] 3.5 Delete the legacy entity-transform-animation leftovers on the JS side, including the suppression mechanism `animation.__getSuppressedFields` and the suppression-release base-props re-sync path, so there is no second transform source competing with native

## 4. Playback and Outlet Semantics

- [ ] 4.1 Add failing tests for `entityProps` lifecycle updates at start, complete, stop, reset, finish, and native-accepted `api.set(values)` writes
- [ ] 4.2 Implement committed transform persistence through `entityProps` without per-frame React updates
- [ ] 4.3 Add failing tests for per-component ownership: for a component that appears in the config, competing React transform writes are ignored during alive playback states; for a component that does not appear in the config, React prop writes still drive it normally during active playback
- [ ] 4.4 Implement committed-state ownership rules: `api.set(values)` only accepts sparse patch objects, native merges patches over the current committed transform baseline, dynamic take-over after inactive playback uses `api.set` rather than competing React prop writes, calling `api.set` during an active animation is not stashed or replayed and does not update `entityProps`, calling `api.set` before binding or native object creation is invalid, start point after set-then-play is `from` when declared else current committed value, and terminal fill writes the terminal transform back to `entityProps` (fill-forwards, no snap-back)
- [ ] 4.5 Add failing tests proving lifecycle callbacks are notifications: `onComplete` return values are ignored and cannot drive the terminal transform

## 5. Capability and Validation

- [ ] 5.1 Add failing tests for the documented Entity motion capability check using `supports('useEntityAnimation')`
- [ ] 5.2 Update runtime capability documentation and implementation behavior to match the new target-state contract
- [ ] 5.3 Add failing tests for explicit validation failures on unsupported Entity motion targets and invalid transform authoring

## 6. Docs, Demos, and Migration

- [ ] 6.1 Update Entity motion docs and examples to use `position` / `rotation` / `scale` config, `animation`, `entityProps`, and patch-object-only `api.set`, with no-bare-`api.get` guidance: read through `entityProps`, write through `api.set(values)`
- [ ] 6.2 Update `apps/test-server` Entity animation demos and capability pages to the new target-state API
- [ ] 6.3 Add migration notes covering the removal of legacy top-level transform config ; the Entity motion binding uses `animation`

## 7. Verification

- [ ] 7.1 Execute the implementation in TDD order: write failing tests first, implement the minimum change to pass, then refactor with tests still green
- [ ] 7.2 Run targeted unit, integration, and capability tests for Entity motion and runtime capabilities, including `api.set(values)` patch-only behavior, active set not stashed, unbound set invalid, set-then-play start point, and terminal fill
- [ ] 7.3 Perform a final proposal-to-implementation review and, once the new path is validated, archive or formally supersede `add-entity-transform-animation`
- [ ] 7.4 Add a test proving that after an animation reaches its terminal state, the transform does not snap back to pre-animation/base props (regression guard for the deleted suppression-release re-sync path)
