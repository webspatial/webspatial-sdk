## 1. Proposal Alignment

- [ ] 1.1 Review the legacy `add-entity-transform-animation` artifacts and mark the exact behaviors that are superseded by this new target state
- [ ] 1.2 Review `spatialized-element-motion-api` references to Entity motion and align wording so the new Entity proposal is the authoritative target state
- [ ] 1.3 Confirm whether `supports('useAnimation', ['entity'])` remains as a temporary compatibility alias or is removed from the documented contract immediately

## 2. Type and Contract Redesign

- [ ] 2.1 Add failing tests for the new `useEntityAnimation` tuple shape `[animation, api, entityProps]`
- [ ] 2.2 Redesign Core and React type surfaces for transform-shaped Entity motion config and transform-only callback values
- [ ] 2.3 Add failing tests for legacy config rejection and unsupported targets such as `opacity`
- [ ] 2.4 Define the public playback surface for Entity motion, including `play`, `pause`, `resume`, `stop`, `reset`, `finish`, and `set`

## 3. Entity Binding Migration

- [ ] 3.1 Add failing tests proving Entity motion binds through `xr-animation` and no longer uses the legacy `animation` prop as target-state behavior
- [ ] 3.2 Update Entity prop contracts and binding lifecycle to use the new Entity motion binding path
- [ ] 3.3 Preserve the single-binding invariant so one animation object cannot drive multiple Entity instances
- [ ] 3.4 Remove or deprecate the legacy Entity `animation` prop path in the implementation and documentation

## 4. Playback and Outlet Semantics

- [ ] 4.1 Add failing tests for `entityProps` lifecycle updates at start, complete, stop, reset, finish, and `set(values)`
- [ ] 4.2 Implement committed transform persistence through `entityProps` without per-frame React updates
- [ ] 4.3 Add failing tests for active transform ownership so animated props ignore competing React transform writes during alive playback states
- [ ] 4.4 Implement terminal-state and `set(values)` ownership rules so React resync preserves committed animation values

## 5. Capability and Validation

- [ ] 5.1 Add failing tests for the documented Entity motion capability check using `supports('useAnimation')`
- [ ] 5.2 Update runtime capability documentation and implementation behavior to match the new target-state contract
- [ ] 5.3 Add failing tests for explicit validation failures on unsupported Entity motion targets and invalid transform authoring

## 6. Docs, Demos, and Migration

- [ ] 6.1 Update Entity motion docs and examples to use transform-shaped config, `xr-animation`, and `entityProps`
- [ ] 6.2 Update `apps/test-server` Entity animation demos and capability pages to the new target-state API
- [ ] 6.3 Add migration notes covering the removal of legacy `animation` prop binding and legacy top-level transform config

## 7. Verification

- [ ] 7.1 Execute the implementation in TDD order: write failing tests first, implement the minimum change to pass, then refactor with tests still green
- [ ] 7.2 Run targeted unit, integration, and capability tests for Entity motion and runtime capabilities
- [ ] 7.3 Perform a final proposal-to-implementation review and archive or supersede the legacy Entity motion proposal once the new path is validated