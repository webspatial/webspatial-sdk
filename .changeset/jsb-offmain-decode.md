---
'@webspatial/platform-visionos': patch
---

Decode JSB command payloads off the main thread.

`JSBManager.handlerMessage` previously did all of its parsing synchronously on
the main thread, where WebKit delivers script messages. Large payloads such as
`CreateEntityAnimation` timelines made that decode a visible main-thread stall.

Commands now flow through a two-stage structured-concurrency pipeline built on
`AsyncStream`: a detached consumer decodes payloads off the main actor, then
hands finished work to a `@MainActor` consumer that invokes the handler and
serializes the reply.

- Each stage is a single sequential `for await` loop, which preserves the
  arrival order JavaScript relies on. A small `ControlEntityAnimation` payload
  can no longer overtake a larger `CreateEntityAnimation` still being decoded.
- The registration maps are read only in the main-thread prologue, so the
  pipeline needs no locking.
- Split the command key from its payload once instead of splitting the whole
  message twice, and reuse one `JSONDecoder` instead of allocating one per
  command.
- Fix a payload containing `::` being mis-parsed as a command with no payload.

Replies for undecodable payloads are now delivered asynchronously. Replies for a
missing payload or an unknown command remain synchronous.
