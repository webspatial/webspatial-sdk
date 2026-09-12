---
'@webspatial/platform-visionos': patch
---

Decode JSB command payloads off the main thread.

`JSBManager.handlerMessage` previously did all of its parsing synchronously on
the main thread, where WebKit delivers script messages. Large payloads such as
`CreateEntityAnimation` timelines made that decode a visible main-thread stall.

- Move the UTF-8 conversion and JSON decode to a dedicated serial queue, keeping
  the main thread free for the handler itself.
- Preserve the arrival order JavaScript relies on: the serial queue feeds a
  single main-queue hop, so a small `ControlEntityAnimation` payload can no
  longer overtake a larger `CreateEntityAnimation` still being decoded.
- Split the command key from its payload once instead of splitting the whole
  message twice, and reuse one `JSONDecoder` instead of allocating one per
  command.
- Fix a payload containing `::` being mis-parsed as a command with no payload.

Replies for undecodable payloads are now delivered asynchronously. Replies for a
missing payload or an unknown command remain synchronous.
