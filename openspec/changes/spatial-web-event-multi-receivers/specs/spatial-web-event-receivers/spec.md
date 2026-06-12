## ADDED Requirements

### Requirement: Event id can register multiple receivers
The system MUST allow multiple receiver callbacks to be registered under the same `SpatialWebEvent` id without overwriting previously registered receivers.

#### Scenario: Second receiver preserves first receiver
- **WHEN** two different callbacks are registered for the same event id
- **THEN** both callbacks MUST remain registered for that id

#### Scenario: Duplicate callback registration is idempotent
- **WHEN** the same callback reference is registered more than once for the same event id
- **THEN** the system MUST keep only one active registration for that callback reference

### Requirement: Dispatch fans out to all receivers for the id
The system MUST dispatch each inbound `SpatialWebEvent` payload to every receiver currently registered for the payload id.

#### Scenario: Payload is delivered to every receiver
- **WHEN** `window.__SpatialWebEvent` receives an event for an id with multiple registered receivers
- **THEN** every registered receiver for that id MUST be invoked with the event data

#### Scenario: One receiver failure does not stop fan-out
- **WHEN** one receiver throws while `window.__SpatialWebEvent` is dispatching an event for an id with multiple registered receivers
- **THEN** the system MUST continue invoking the remaining registered receivers for that id

#### Scenario: Unknown id is ignored
- **WHEN** `window.__SpatialWebEvent` receives an event for an id with no registered receivers
- **THEN** the system MUST complete without invoking any receiver

### Requirement: Receiver cleanup supports targeted and full removal
The system MUST support removing a specific receiver for an id and removing all receivers for an id.

#### Scenario: Targeted removal keeps other receivers
- **WHEN** a specific callback is removed from an id that still has other callbacks
- **THEN** the removed callback MUST no longer receive events
- **AND** the remaining callbacks for that id MUST continue receiving events

#### Scenario: Full removal clears all receivers for id
- **WHEN** `removeEventReceiver` is called for an id without a callback argument
- **THEN** all receivers for that id MUST be removed

#### Scenario: Empty receiver set is removed
- **WHEN** the last receiver for an id is removed
- **THEN** the internal receiver registry MUST no longer retain an entry for that id