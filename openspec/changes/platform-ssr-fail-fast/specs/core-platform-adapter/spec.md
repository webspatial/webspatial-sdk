## ADDED Requirements

### Requirement: Platform construction is client-only

The core SDK MUST construct a native JSB platform adapter only in a browser environment where `window` is defined. Platform APIs (`callJSB`, `openSpatialSceneSync`, `createNativeSpatialDiv`, `createNativeAttachment`) MUST NOT be invoked during SSR or other non-browser execution as part of a supported application integration.

#### Scenario: SSR or no window rejects platform creation

- **WHEN** `createPlatformSync()` or `createPlatform()` is called while `typeof window === 'undefined'`
- **THEN** the call MUST throw an `Error` with a message that states platform APIs cannot run during SSR
- **AND** the message MUST point integrators to `@webspatial/react-sdk` default-entry facades or CSR-gated spatial UI
- **AND** the call MUST NOT return a no-op platform that reports `{ success: true }`

#### Scenario: Browser selects platform by user agent

- **WHEN** `createPlatformSync()` is called in a browser environment
- **THEN** the implementation MUST resolve the platform kind from `navigator.userAgent` via `resolveJsbAdapterPlatform`
- **AND** MUST return the matching `PuppeteerPlatform`, `PicoOSPlatform`, or `VisionOSPlatform` instance
