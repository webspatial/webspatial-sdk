## ADDED Requirements

### Requirement: Legacy session animation remains historical only

The removed Plan A session animation path MUST remain documented only as historical context. It MUST NOT define normative requirements for the current API surface.

#### Scenario: New integrations use target-state animation

- **WHEN** authors create new spatialized element animation integrations
- **THEN** they MUST use the unified `useAnimation(config)` timeline API with `xr-animation`
- **AND** they MUST NOT use the removed legacy `animation` prop path

## Notes

### Historical summary

- Plan A used `useAnimation(config)` plus an `animation` prop on `enable-xr` nodes.
- The compatibility path has been removed from the target-state API.
- New integrations MUST use the unified `useAnimation(config)` timeline API with `xr-animation`.

### Cross-references

- Archived Plan A spec: `openspec/changes/archive/spatial-div-animation-api/specs/spatial-div-animation/spec.md`
- Unified umbrella: `openspec/changes/spatialized-element-motion-api/`
