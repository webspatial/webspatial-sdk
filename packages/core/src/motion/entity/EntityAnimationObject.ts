import {
  ControlEntityAnimationJSBCommand,
  SetEntityAnimationJSBCommand,
  UpdateEntityAnimationJSBCommand,
} from '../../JSBCommand'
import { SpatialObject } from '../../SpatialObject'
import { SpatialWebEvent } from '../../SpatialWebEvent'
import { SpatialWebMsgType } from '../../WebMsgCommand'
import type { ObjectDestroyMsg } from '../../WebMsgCommand'
import type {
  EntityAnimationControlType,
  EntityAnimationErrorMsg,
  EntityMotionCallbackAction,
  EntityMotionConfig,
  EntityMotionNativePlayState,
  EntityMotionProps,
  EntityMotionStateChangedMsg,
  EntityMotionTimelinePayload,
  EntityPlaybackApi,
  EntityTransformUpdate,
  SetEntityAnimationResult,
  UpdateEntityAnimationResult,
} from '../../types/motion/entityMotion'
import type { SpatializedMotionPlayState } from '../../types/motion/spatializedMotion'
import type { SpatializedPlaybackError } from '../../types/motion/spatializedPlayback'
import {
  normalizeEntityMotionConfig,
  validateEntityTransformUpdate,
} from './normalizeEntityMotionConfig'

const ENTITY_MOTION_CALLBACK_ACTIONS = [
  'start',
  'complete',
  'stop',
  'reset',
] as const
const ENTITY_MOTION_NATIVE_PLAY_STATES = [
  'idle',
  'running',
  'paused',
  'finished',
] as const
const ENTITY_MOTION_ERROR_CODES = [
  'TARGET_NOT_FOUND',
  'UNSUPPORTED_TARGET',
  'ANIMATION_NOT_FOUND',
  'INVALID_TIMELINE',
  'COMPILATION_FAILED',
  'INVALID_CONTROL_STATE',
  'INVALID_SET_VALUES',
] as const

/** Immutable inputs retained by one Core Entity animation object. */
export interface EntityAnimationObjectOptions {
  /** Public config snapshot used to create this object. */
  config: EntityMotionConfig
  /** Canonical timeline sent to Native. */
  timeline: EntityMotionTimelinePayload
}

const entityAnimationObjectOptions = new WeakMap<
  EntityAnimationObject,
  EntityAnimationObjectOptions
>()

/**
 * Creates an Entity animation object through the package-internal canonical path.
 *
 * @param id - Native Entity animation object's `SpatialObject.id`.
 * @param options - Internal config and canonical timeline snapshots.
 * @returns Core Entity animation object with private internal snapshots.
 */
export function createEntityAnimationObject(
  id: string,
  options: EntityAnimationObjectOptions,
): EntityAnimationObject {
  const animation = new EntityAnimationObject(id)
  entityAnimationObjectOptions.set(animation, options)
  return animation
}

/** Core playback object for one Native Entity animation object. */
export class EntityAnimationObject
  extends SpatialObject
  implements EntityPlaybackApi
{
  /** Current Native-confirmed playback state. */
  private _playState: SpatializedMotionPlayState = 'idle'
  /** Registered start observer. */
  private startListener?: (values: EntityMotionProps) => void
  /** Registered completion observer. */
  private completeListener?: (values: EntityMotionProps) => void
  /** Registered stop observer. */
  private stopListener?: (values: EntityMotionProps) => void
  /** Registered reset observer. */
  private resetListener?: (values: EntityMotionProps) => void
  /** Registered error observer. */
  private errorListener?: (error: SpatializedPlaybackError) => void
  /** Registered confirmed-values observer. */
  private valuesListener?: (values: EntityMotionProps) => void
  /** Registered Native playback-state observer. */
  private playStateListener?: (state: EntityMotionNativePlayState) => void
  /** Error fingerprints already reported during the current command cycle. */
  private reportedErrors = new Set<string>()
  /** Latest execution revision committed by Native. */
  private executionRevision = 0

  /** Creates a public Core handle and begins receiving events addressed by its id. */
  constructor(id: string) {
    super(id)
    SpatialWebEvent.addEventReceiver(id, data => this.onReceiveEvent(data))
  }

  /** Returns the latest Native-confirmed playback state. */
  get playState(): SpatializedMotionPlayState {
    return this._playState
  }

  /** Reports whether playback is running. */
  get isAnimating(): boolean {
    return this._playState === 'running'
  }

  /** Reports whether playback is paused. */
  get isPaused(): boolean {
    return this._playState === 'paused'
  }

  /** Reports whether playback reached its terminal state. */
  get finished(): boolean {
    return this._playState === 'finished'
  }

  /** Starts fresh playback or resumes paused playback. */
  play(): Promise<void> {
    return this.control('play')
  }

  /** Pauses running playback. */
  pause(): Promise<void> {
    return this.control('pause')
  }

  /** Stops playback at the current transform. */
  stop(): Promise<void> {
    return this.control('stop')
  }

  /** Resets playback to its starting transform. */
  reset(): Promise<void> {
    return this.control('reset')
  }

  /** Commits the terminal transform and finishes playback. */
  finish(): Promise<void> {
    return this.control('finish')
  }

  /** Validates and sends a sparse transform update through Native. */
  set(update: EntityTransformUpdate): Promise<EntityMotionProps | void> {
    validateEntityTransformUpdate(update)
    return this.performSet(update).catch(error => {
      this.reportErrorOnce({
        code: 'COMPILATION_FAILED',
        reason:
          error instanceof Error
            ? error.message
            : 'Entity animation set command failed',
      })
      return undefined
    })
  }

  /** Validates and commits a changed execution definition in place. */
  update(config: EntityMotionConfig): Promise<void> {
    const timeline = normalizeEntityMotionConfig(config)
    if (this.isDestroyed) return Promise.resolve()
    const current = entityAnimationObjectOptions.get(this)
    if (current && this.timelinesEqual(current.timeline, timeline)) {
      return Promise.resolve()
    }
    return this.performUpdate(config, timeline)
  }

  /** Registers the start observer used by Core consumers. */
  onStart(listener: (values: EntityMotionProps) => void): void {
    this.startListener = listener
  }

  /** Registers the completion observer used by Core consumers. */
  onComplete(listener: (values: EntityMotionProps) => void): void {
    this.completeListener = listener
  }

  /** Registers the stop observer used by Core consumers. */
  onStop(listener: (values: EntityMotionProps) => void): void {
    this.stopListener = listener
  }

  /** Registers the reset observer used by Core consumers. */
  onReset(listener: (values: EntityMotionProps) => void): void {
    this.resetListener = listener
  }

  /** Registers the asynchronous bridge error observer. */
  onError(listener: (error: SpatializedPlaybackError) => void): void {
    this.errorListener = listener
  }

  /** Registers the confirmed-transform observer used by bindings. */
  onValuesChange(listener: (values: EntityMotionProps) => void): void {
    this.valuesListener = listener
  }

  /**
   * Registers the package-internal Native playback-state observer.
   *
   * @internal
   */
  onPlayStateChange(
    listener: (state: EntityMotionNativePlayState) => void,
  ): void {
    this.playStateListener = listener
  }

  /** Destroys the dedicated Native Entity animation object idempotently. */
  override async destroy(): Promise<void> {
    if (this.isDestroyed) return
    const ret = await new ControlEntityAnimationJSBCommand({
      id: this.id,
      type: 'destroy',
    }).execute()
    if (!ret.success) {
      const error = this.reportReplyError(ret)
      throw new Error(error.reason)
    }
    this.isDestroyed = true
    this.onDestroy()
  }

  /** Removes the event receiver owned by this animation object. */
  protected override onDestroy(): void {
    SpatialWebEvent.removeEventReceiver(this.id)
  }

  /** Sends one ordered playback control to the dedicated Native protocol. */
  private async control(type: EntityAnimationControlType): Promise<void> {
    if (this.isDestroyed) return
    this.reportedErrors.clear()
    const ret = await new ControlEntityAnimationJSBCommand({
      id: this.id,
      type,
    }).execute()
    if (!ret.success) {
      this.reportReplyError(ret)
      return
    }
  }

  /** Sends one validated transform update and forwards confirmed values. */
  private async performSet(
    update: EntityTransformUpdate,
  ): Promise<EntityMotionProps | void> {
    if (this.isDestroyed) {
      console.warn('Entity animation set ignored after destroy')
      return
    }
    this.reportedErrors.clear()
    const ret = await new SetEntityAnimationJSBCommand({
      id: this.id,
      update,
    }).execute()
    if (!ret.success) {
      if (ret.errorCode === 'INVALID_CONTROL_STATE') {
        console.warn(ret.errorMessage ?? 'Entity animation set is not allowed')
        return
      }
      this.reportReplyError(ret)
      return
    }
    const result = ret.data as SetEntityAnimationResult | undefined
    const confirmedValues = result?.values
    const validationError = this.getConfirmedValuesError(confirmedValues)
    if (validationError) {
      this.reportErrorOnce({
        code: 'INVALID_SET_VALUES',
        reason: validationError,
      })
      return
    }
    this.valuesListener?.(confirmedValues!)
    return confirmedValues!
  }

  /** Sends one candidate timeline and commits snapshots only after confirmation. */
  private async performUpdate(
    config: EntityMotionConfig,
    timeline: EntityMotionTimelinePayload,
  ): Promise<void> {
    this.reportedErrors.clear()
    try {
      const ret = await new UpdateEntityAnimationJSBCommand({
        id: this.id,
        timeline,
      }).execute()
      if (!ret.success) {
        this.reportReplyError(ret)
        return
      }
      const result = ret.data as UpdateEntityAnimationResult | undefined
      const confirmedValues = result?.values
      const validationError = this.getConfirmedValuesError(confirmedValues)
      if (
        validationError ||
        !Number.isSafeInteger(result?.revision) ||
        result!.revision <= this.executionRevision
      ) {
        this.reportErrorOnce({
          code: 'COMPILATION_FAILED',
          reason:
            validationError ??
            '[EntityAnimationObject] update revision must increase',
        })
        return
      }
      entityAnimationObjectOptions.set(this, { config, timeline })
      this.executionRevision = result!.revision
      this.valuesListener?.(confirmedValues!)
    } catch (error) {
      this.reportErrorOnce({
        code: 'COMPILATION_FAILED',
        reason:
          error instanceof Error
            ? error.message
            : 'Entity animation update command failed',
      })
    }
  }

  /** Compares detached canonical timelines as execution definitions. */
  private timelinesEqual(
    left: EntityMotionTimelinePayload,
    right: EntityMotionTimelinePayload,
  ): boolean {
    return JSON.stringify(left) === JSON.stringify(right)
  }

  /** Converts one failed command reply into one public playback error. */
  private reportReplyError(ret: {
    errorCode?: string
    errorMessage?: string
  }): SpatializedPlaybackError {
    const error: SpatializedPlaybackError = {
      code: this.toPlaybackErrorCode(ret.errorCode),
      reason: ret.errorMessage ?? 'Entity animation command failed',
    }
    this.reportErrorOnce(error)
    return error
  }

  /** Reports one error fingerprint at most once in the current command cycle. */
  private reportErrorOnce(error: SpatializedPlaybackError): void {
    const fingerprint = `${error.code}\0${error.reason}`
    if (this.reportedErrors.has(fingerprint)) return
    this.reportedErrors.add(fingerprint)
    this.errorListener?.(error)
  }

  /** Narrows a bridge error code to the closed public error-code set. */
  private toPlaybackErrorCode(
    code: string | undefined,
  ): SpatializedPlaybackError['code'] {
    switch (code) {
      case 'TARGET_NOT_FOUND':
      case 'UNSUPPORTED_TARGET':
      case 'ANIMATION_NOT_FOUND':
      case 'INVALID_TIMELINE':
      case 'COMPILATION_FAILED':
      case 'INVALID_CONTROL_STATE':
      case 'INVALID_SET_VALUES':
        return code
      default:
        return 'COMPILATION_FAILED'
    }
  }

  /** Routes one id-addressed Native state or error event. */
  private onReceiveEvent(data: unknown): void {
    if (this.isObjectDestroyMsg(data)) {
      this.isDestroyed = true
      this.onDestroy()
      return
    }
    if (this.isStateChangedMsg(data)) {
      if (data.detail.id !== this.id) return
      if (data.detail.revision < this.executionRevision) return
      this.reportedErrors.clear()
      this._playState = data.detail.playState
      this.playStateListener?.(data.detail.playState)
      const callbackAction = data.detail.callbackAction
      if (!callbackAction) return
      const values = data.detail.values
      if (!values) return
      this.valuesListener?.(values)
      switch (callbackAction) {
        case 'start':
          this.startListener?.(values)
          return
        case 'complete':
          this.completeListener?.(values)
          return
        case 'stop':
          this.stopListener?.(values)
          return
        case 'reset':
          this.resetListener?.(values)
          return
      }
    }
    if (this.isErrorMsg(data) && data.detail.id === this.id) {
      this.reportErrorOnce(data.detail.error)
    }
  }

  /** Checks the id-addressed native object-destruction event. */
  private isObjectDestroyMsg(data: unknown): data is ObjectDestroyMsg {
    return (
      Boolean(data) &&
      typeof data === 'object' &&
      (data as Partial<ObjectDestroyMsg>).type ===
        SpatialWebMsgType.objectdestroy
    )
  }

  /** Checks the dedicated state-event envelope and required detail fields. */
  private isStateChangedMsg(
    data: unknown,
  ): data is EntityMotionStateChangedMsg {
    if (!data || typeof data !== 'object') return false
    const candidate = data as Partial<EntityMotionStateChangedMsg>
    const detail = candidate.detail
    if (
      candidate.type !== 'spatialanimationstatechanged' ||
      typeof detail?.id !== 'string' ||
      !Number.isSafeInteger(detail.revision) ||
      detail.revision < 0 ||
      !(ENTITY_MOTION_NATIVE_PLAY_STATES as readonly unknown[]).includes(
        detail.playState,
      )
    ) {
      return false
    }
    const callbackAction = detail.callbackAction
    if (callbackAction === undefined) return detail.values === undefined
    return (
      (
        ENTITY_MOTION_CALLBACK_ACTIONS as readonly EntityMotionCallbackAction[]
      ).includes(callbackAction) &&
      this.getConfirmedValuesError(detail.values) === undefined
    )
  }

  /** Checks the dedicated asynchronous error-event envelope. */
  private isErrorMsg(data: unknown): data is EntityAnimationErrorMsg {
    if (!data || typeof data !== 'object') return false
    const candidate = data as Partial<EntityAnimationErrorMsg>
    const detail = candidate.detail
    return (
      candidate.type === 'entityanimationerror' &&
      typeof detail?.id === 'string' &&
      (ENTITY_MOTION_ERROR_CODES as readonly unknown[]).includes(
        detail.error?.code,
      ) &&
      typeof detail.error?.reason === 'string'
    )
  }

  /** Validates one complete Native-confirmed Entity transform result. */
  private getConfirmedValuesError(values: unknown): string | undefined {
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      return '[EntityAnimationObject] confirmed values.position is required'
    }
    const record = values as Record<string, unknown>
    for (const component of ['position', 'rotation', 'scale'] as const) {
      const componentValue = record[component]
      if (
        !componentValue ||
        typeof componentValue !== 'object' ||
        Array.isArray(componentValue)
      ) {
        return `[EntityAnimationObject] confirmed values.${component} is required`
      }
      const axes = componentValue as Record<string, unknown>
      for (const axis of ['x', 'y', 'z'] as const) {
        const scalar = axes[axis]
        if (typeof scalar !== 'number' || !Number.isFinite(scalar)) {
          return `[EntityAnimationObject] confirmed values.${component}.${axis} must be finite`
        }
        if (component === 'scale' && scalar < 0) {
          return `[EntityAnimationObject] confirmed values.scale.${axis} must be non-negative`
        }
      }
    }
    return undefined
  }
}
