import type {
  MotionFieldMetadata,
  MotionFieldMetadataMap,
} from './motionBindingTypes'
import { getMotionFieldDescriptors } from './plugins/registry'
import type { MotionOwnershipField } from './plugins/types'

/** Snapshot consumed by motion sync to resolve native writes. */
export type PortalMotionSyncInput = {
  /** The computed style snapshot read from the live DOM node. */
  computedStyle: CSSStyleDeclaration
  /** The latest transform matrix pushed by the container runtime. */
  transformMatrix: DOMMatrix
}

/** Motion sync payload emitted by the motion controller. */
export type PortalMotionSyncResult = {
  /** Native properties resolved from motion descriptors. */
  properties: Record<string, any>
  /** Optional transform resolved from the descriptor pipeline. */
  nextTransform: DOMMatrix | null
}

/**
 * Encapsulates motion suppression state and descriptor-driven sync decisions
 * for a portal instance.
 */
export class PortalMotionController {
  /**
   * Fields currently suppressed by an active SpatialDiv animation session.
   * When set, descriptor-driven sync will skip these fields.
   */
  private _suppressedFields: Set<string> | null = null

  /** Caches field metadata mirrored from React motion bindings. */
  private _motionFieldMetadata: MotionFieldMetadataMap = {}

  /**
   * Sets the current suppression set and reports whether outer sync should run
   * immediately because suppression has just been released.
   *
   * @param fields - The next suppression set, or null to clear suppression.
   * @returns Whether the caller should trigger an immediate re-sync.
   */
  setSuppressedFields(fields: Set<string> | null): boolean {
    const hadSuppression =
      this._suppressedFields !== null && this._suppressedFields.size > 0
    this._suppressedFields = fields
    return hadSuppression && (fields === null || fields.size === 0)
  }

  /**
   * Stores unified motion field metadata mirrored from React bindings.
   *
   * @param field - The field whose metadata changed.
   * @param metadata - The partial metadata payload that should be merged in.
   */
  setMotionFieldMetadata(
    field: MotionOwnershipField,
    metadata: Partial<MotionFieldMetadata>,
  ) {
    const current = this.getMotionFieldMetadata(field)
    const next: MotionFieldMetadata = {
      authoredValue:
        'authoredValue' in metadata
          ? metadata.authoredValue
          : current.authoredValue,
      terminalOwner:
        'terminalOwner' in metadata
          ? (metadata.terminalOwner ?? null)
          : current.terminalOwner,
    }
    this._motionFieldMetadata = {
      ...this._motionFieldMetadata,
      [field]: next,
    }
  }

  /**
   * Returns whether a field is currently suppressed.
   *
   * @param field - The field name to check.
   * @returns Whether sync for the field is currently suppressed.
   */
  isFieldSuppressed(field: string): boolean {
    return this._suppressedFields?.has(field) ?? false
  }

  /**
   * Resolves motion-driven native property and transform updates for the
   * current DOM snapshot.
   *
   * @param input - The DOM and transform snapshot used for resolution.
   * @returns The motion patch that should be applied to the native element.
   */
  buildSyncResult(input: PortalMotionSyncInput): PortalMotionSyncResult {
    const properties: Record<string, any> = {}
    let nextTransform: DOMMatrix | null = null
    for (const descriptor of getMotionFieldDescriptors()) {
      if (this.isFieldSuppressed(descriptor.field)) {
        continue
      }
      const metadata = this.getMotionFieldMetadata(descriptor.field)
      const domValue = descriptor.readOuterDomValue(input)
      const decision = descriptor.resolveOuterSync({
        owner: metadata.terminalOwner,
        authoredValue: metadata.authoredValue,
        domValue,
      })
      if (decision.mode === 'omit') {
        continue
      }
      const resolvedValue = decision.mode === 'set' ? decision.value : domValue
      if (descriptor.nativeSink.kind === 'property') {
        properties[descriptor.nativeSink.property] = resolvedValue
        continue
      }
      nextTransform = resolvedValue as DOMMatrix
    }
    return {
      properties,
      nextTransform,
    }
  }

  /**
   * Returns the normalized metadata cached for a motion field.
   *
   * @param field - The field whose metadata should be returned.
   * @returns The normalized field metadata snapshot.
   */
  private getMotionFieldMetadata(
    field: MotionOwnershipField,
  ): MotionFieldMetadata {
    return (
      this._motionFieldMetadata[field] ?? {
        terminalOwner: null,
      }
    )
  }
}
