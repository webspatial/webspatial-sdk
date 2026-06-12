## 1. Spec and alignment

- [x] 1.1 Add OpenSpec proposal, design, tasks, and spec files for multi-receiver `SpatialWebEvent` behavior.
- [x] 1.2 Align the documented receiver lifecycle with the branch implementation and existing consumer usage.

## 2. Core event routing

- [x] 2.1 Replace single-callback storage with a per-id multi-receiver registry.
- [x] 2.2 Dispatch each inbound event payload to all receivers currently registered for the id.
- [x] 2.3 Support both targeted callback removal and whole-id cleanup, and delete empty registry entries.

## 3. Verification

- [x] 3.1 Add or update tests that verify multiple receivers on the same id are all invoked.
- [x] 3.2 Add or update tests that verify targeted removal leaves other receivers active.
- [x] 3.3 Add or update tests that verify full removal clears the id entry for destroy and one-shot callback flows.
- [x] 3.4 Add or update tests that verify one receiver failure does not stop fan-out to remaining receivers.