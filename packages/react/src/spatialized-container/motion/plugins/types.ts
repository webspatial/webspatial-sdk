import type { CSSProperties } from 'react'

/** Supported motion ownership field identifier. */
export type MotionOwnershipField = string

/** Declares which layer keeps visual ownership after suppression clears. */
export type MotionTerminalOwner = 'authored' | 'native' | null

/** React-authored field inputs collected from the currently bound node. */
export interface MotionFieldAuthoredInputs {
  /** Full React `style` object captured from the currently bound node. */
  style?: CSSProperties
  /** Additional authored React props available to custom field descriptors. */
  props?: Record<string, unknown>
}

/** Context used when a field plugin captures authored input values. */
export interface CaptureMotionFieldAuthoredValueContext {
  /** The current React-authored inputs collected from the bound node. */
  authoredInputs: MotionFieldAuthoredInputs
}

/** Context used when a field descriptor reads authored input directly. */
export interface ReadMotionFieldAuthoredValueContext {
  /** The current React-authored inputs collected from the bound node. */
  authoredInputs: MotionFieldAuthoredInputs
}

/** Context used when a field descriptor reads raw React motion style output. */
export interface ReadMotionFieldRawValueContext {
  /** The raw motion style generated from sampled controller values. */
  rawStyle: CSSProperties
}

/** Context used when a field plugin resolves terminal ownership. */
export interface ResolveMotionTerminalOwnerContext {
  /** The authored value cached for the field while suppression was active. */
  authoredValue: unknown
}

/** Field-level decision applied to the inner DOM style outlet. */
export type MotionInnerStyleDecision =
  | { mode: 'default' }
  | { mode: 'omit' }
  | {
      mode: 'set'
      value: CSSProperties['opacity'] | CSSProperties['transform']
    }

/** Context used when a field plugin resolves inner DOM output. */
export interface ResolveMotionInnerStyleContext {
  /** Indicates whether native playback is still suppressing the field. */
  suppressed: boolean
  /** The owner selected for the field after terminal handoff. */
  owner: MotionTerminalOwner
  /** The authored value cached for the field while suppression was active. */
  authoredValue: unknown
  /** The raw React motion value sampled from the controller timeline. */
  rawValue: unknown
}

/** Field-level decision applied to outer native property synchronization. */
export type MotionOuterSyncDecision =
  | { mode: 'default' }
  | { mode: 'omit' }
  | { mode: 'set'; value: unknown }

/** Context used when a field plugin resolves outer native sync behavior. */
export interface ResolveMotionOuterSyncContext {
  /** The owner selected for the field after terminal handoff. */
  owner: MotionTerminalOwner
  /** The authored value cached for the field while suppression was active. */
  authoredValue: unknown
  /** The DOM-derived value that would normally sync to native. */
  domValue: unknown
}

/** Output location used when a descriptor writes to the native host sink. */
export type MotionFieldNativeSink =
  | {
      /** Writes through `updateProperties()`. */
      kind: 'property'
      /** Native property name that should receive the resolved value. */
      property: string
    }
  | {
      /** Writes through `updateTransform()`. */
      kind: 'transform'
    }

/** Context used when a field descriptor reads the current DOM sync candidate. */
export interface ReadMotionFieldOuterDomValueContext {
  /** Computed style snapshot captured from the bound DOM node. */
  computedStyle: CSSStyleDeclaration
  /** The latest spatial transform matrix mirrored from the container runtime. */
  transformMatrix: DOMMatrix
}

/** Descriptor object that defines the full lifecycle of one motion field. */
export interface MotionFieldDescriptor {
  /** The field controlled by this plugin. */
  readonly field: MotionOwnershipField

  /** Optional React style key used when emitting inner DOM style patches. */
  readonly styleKey?: keyof CSSProperties

  /** Native sink that should receive outer-sync writes for this field. */
  readonly nativeSink: MotionFieldNativeSink

  /**
   * Reads the authored React value for the field directly from container inputs.
   *
   * @param context - The current authored inputs collected from React props.
   * @returns The authored value that should be treated as the field source.
   */
  readAuthoredValue(context: ReadMotionFieldAuthoredValueContext): unknown

  /**
   * Reads the raw motion style value for this field from the sampled style map.
   *
   * @param context - The raw motion style generated from controller values.
   * @returns The raw field value sampled from the motion style outlet.
   */
  readRawValue(context: ReadMotionFieldRawValueContext): unknown

  /**
   * Reads the current DOM-derived candidate value for outer native sync.
   *
   * @param context - DOM and container data used to compute native sync input.
   * @returns The DOM-derived value that would normally sync to native.
   */
  readOuterDomValue(context: ReadMotionFieldOuterDomValueContext): unknown

  /**
   * Captures the explicit authored value for the field while native playback is
   * suppressing React output.
   *
   * @param context - The current authored inputs collected from React props.
   * @returns The authored field value that should be cached for terminal handoff.
   */
  captureAuthoredValue(context: CaptureMotionFieldAuthoredValueContext): unknown

  /**
   * Resolves who should own the field after suppression clears.
   *
   * @param context - The cached authored field value.
   * @returns The post-terminal ownership decision for the field.
   */
  resolveTerminalOwner(
    context: ResolveMotionTerminalOwnerContext,
  ): MotionTerminalOwner

  /**
   * Resolves how the field should appear in the inner DOM style outlet.
   *
   * @param context - The field state needed to compute inner DOM output.
   * @returns The style decision for the field.
   */
  resolveInnerStyle(
    context: ResolveMotionInnerStyleContext,
  ): MotionInnerStyleDecision

  /**
   * Resolves how the field should sync to the outer native element.
   *
   * @param context - The field state needed to compute native sync behavior.
   * @returns The outer native sync decision for the field.
   */
  resolveOuterSync(
    context: ResolveMotionOuterSyncContext,
  ): MotionOuterSyncDecision
}

/** Backward-compatible alias used by existing call sites. */
export type MotionFieldPlugin = MotionFieldDescriptor
