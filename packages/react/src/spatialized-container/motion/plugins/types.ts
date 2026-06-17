import type { CSSProperties } from 'react'

/** Supported motion ownership fields in the first pluginized rollout. */
export type MotionOwnershipField = 'opacity'

/** Declares which layer keeps visual ownership after suppression clears. */
export type MotionTerminalOwner = 'authored' | 'native' | null

/** React-authored field inputs collected from the currently bound node. */
export interface MotionFieldAuthoredInputs {
  /** Explicit React-authored `style.opacity`, if present. */
  opacity?: CSSProperties['opacity']
}

/** Context used when a field plugin captures authored input values. */
export interface CaptureMotionFieldAuthoredValueContext {
  /** The current React-authored inputs collected from the bound node. */
  authoredInputs: MotionFieldAuthoredInputs
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
  | { mode: 'set'; value: CSSProperties['opacity'] }

/** Context used when a field plugin resolves inner DOM output. */
export interface ResolveMotionInnerStyleContext {
  /** Indicates whether native playback is still suppressing the field. */
  suppressed: boolean
  /** The owner selected for the field after terminal handoff. */
  owner: MotionTerminalOwner
  /** The authored value cached for the field while suppression was active. */
  authoredValue: unknown
  /** The raw React motion value sampled from the controller timeline. */
  rawValue: CSSProperties['opacity']
}

/** Field-level decision applied to outer native property synchronization. */
export type MotionOuterSyncDecision =
  | { mode: 'default' }
  | { mode: 'omit' }
  | { mode: 'set'; value: number }

/** Context used when a field plugin resolves outer native sync behavior. */
export interface ResolveMotionOuterSyncContext {
  /** The owner selected for the field after terminal handoff. */
  owner: MotionTerminalOwner
  /** The authored value cached for the field while suppression was active. */
  authoredValue: unknown
  /** The DOM-derived value that would normally sync to native. */
  domValue: number
}

/** Hook-like strategy object that customizes ownership behavior for one field. */
export interface MotionFieldPlugin {
  /** The field controlled by this plugin. */
  readonly field: MotionOwnershipField

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
