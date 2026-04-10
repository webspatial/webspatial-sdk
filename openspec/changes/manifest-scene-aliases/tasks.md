## 1. Spec and docs

- [x] 1.1 Add OpenSpec proposal, design, tasks, and spec files for manifest scene alias handling.
- [x] 1.2 Update public manifest API documentation to describe supported aliases, precedence, and normalization behavior.

## 2. Core implementation

- [x] 2.1 Add helper logic to resolve supported snake_case and camelCase aliases for manifest scene config fields.
- [x] 2.2 Normalize supported resizability aliases and override selectors before merging scene defaults.
- [x] 2.3 Preserve existing merge precedence and callback chaining behavior while applying normalized manifest defaults.

## 3. Verification

- [x] 3.1 Add or update tests for same-layer alias precedence and override priority.
- [x] 3.2 Add or update tests for mixed-case override selectors and resizability alias normalization.
- [x] 3.3 Add or update tests that confirm callback chaining still receives the previous raw callback return value.