/**
 * Thrown when a runtime-gated JS API is invoked but `supports('<name>')` is false.
 * See OpenSpec `runtime-capabilities/spec.md` (Unsupported behavior contracts).
 */
export class WebSpatialRuntimeError extends Error {
  public readonly capability: string

  constructor(capability: string, message?: string) {
    super(
      message ??
        `Capability "${capability}" is not supported in this WebSpatial runtime`,
    )
    this.name = 'WebSpatialRuntimeError'
    this.capability = capability
  }
}
