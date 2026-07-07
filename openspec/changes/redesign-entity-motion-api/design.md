## Context

This file is intentionally kept minimal for now.

The current change uses `proposal.md` as the primary document for public API definition and product-facing scope, while normative behavior is captured in `specs/`.

## Goals / Non-Goals

**Goals:**
- Reserve a place for future implementation architecture if a dedicated technical design is still needed

**Non-Goals:**
- Duplicating public API definition that already lives in `proposal.md`
- Restating normative behavior that already lives in `specs/`

## Decisions

- Keep `proposal.md` as the primary source of truth for the target-state API surface during the proposal phase
- Keep `specs/` as the source of truth for behavioral requirements
- Defer detailed implementation architecture until it is necessary to unblock implementation

## Risks / Trade-offs

- [Technical implementation detail is deferred] -> If implementation begins and architecture questions remain, a follow-up design pass must be added before coding proceeds