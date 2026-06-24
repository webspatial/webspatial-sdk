import type {
  AnimationObject,
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionAuthorConfig,
  SpatializedMotionConfig,
  SpatializedMotionKind,
  SpatializedMotionPlayState,
  SpatializedPlaybackApi,
  SpatializedStatic3DElement,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import {
  evaluateMotionTimeline,
  getMotionSuppressedFields,
  normalizeMotionConfig,
  supports,
  validateSpatializedMotionConfig,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { getMotionConfigSignature } from './motionConfigSignature'
import type {
  MotionFieldMetadata,
  TerminalOpacityOwner,
  TerminalTransformOwner,
} from './motionBindingTypes'
import {
  getMotionFieldPlugin,
  getMotionOwnershipFields,
} from './plugins/registry'
import type { MotionOwnershipField, MotionTerminalOwner } from './plugins/types'

type AnimationCommandType =
  | 'play'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'reset'
  | 'finish'

type AnimationCommand = {
  type: AnimationCommandType
}

type AnimationTargetElement = (
  | Spatialized2DElement
  | SpatializedStatic3DElement
  | SpatializedDynamic3DElement
) & {
  createAnimation: (
    config: SpatializedMotionAuthorConfig,
  ) => Promise<AnimationObject>
}

interface AnimationBindingOptions {
  onValuesChange?: (values: SpatializedVisualValues) => void
  onStateChange?: () => void
  onMotionFieldMetadataChange?: (
    field: MotionOwnershipField,
    metadata: MotionFieldMetadata,
  ) => void
  onExplicitStyleOpacityChange?: (
    opacity: CSSProperties['opacity'] | undefined,
  ) => void
  onTerminalOpacityOwnerChange?: (owner: TerminalOpacityOwner) => void
  onExplicitStyleTransformChange?: (
    transform: CSSProperties['transform'] | undefined,
  ) => void
  onTerminalTransformOwnerChange?: (owner: TerminalTransformOwner) => void
}

let nextBindingId = 0

function allocateBindingId(): string {
  nextBindingId += 1
  return `motion-binding_${nextBindingId}_${Date.now()}`
}

function supportsTargetKind(kind: SpatializedMotionKind): boolean {
  return supports('useAnimation', [kind === 'spatialized2d' ? 'element' : kind])
}

/**
 * React-owned binding for spatialized motion.
 *
 * The binding stores config, queues explicit commands before target bind,
 * creates the Core AnimationObject only after a concrete target is resolved,
 * and mirrors runtime state back into React.
 */
export class AnimationBinding implements SpatializedPlaybackApi {
  readonly __kind = 'spatializedMotion' as const
  readonly __propName = 'xr-animation' as const
  readonly __motionObjectId: string

  private animationObject: AnimationObject | null = null
  private element:
    | HTMLElement
    | Spatialized2DElement
    | SpatializedStatic3DElement
    | SpatializedDynamic3DElement
    | null = null
  private kind: SpatializedMotionKind | null = null
  private destroyed = false
  private creating = false
  private createToken = 0
  private pendingCommands: AnimationCommand[] = []
  private configSignature: string
  private config: SpatializedMotionAuthorConfig
  private normalizedConfig: SpatializedMotionConfig
  private values: SpatializedVisualValues
  private state: SpatializedMotionPlayState = 'idle'
  private isAnimatingState = false
  private isPausedState = false
  private finishedState = false
  private readonly options: AnimationBindingOptions

  /** Lists the ownership-managed fields enabled for this binding instance. */
  private readonly supportedOwnershipFields = getMotionOwnershipFields()

  /** Stores the plugin selected for each ownership-managed field. */
  private readonly fieldPlugins = new Map(
    this.supportedOwnershipFields.map(field => [
      field,
      getMotionFieldPlugin(field),
    ]),
  )

  /** Caches authored values captured while native playback suppresses a field. */
  private readonly authoredFieldValues = new Map<
    MotionOwnershipField,
    unknown
  >()

  /** Caches post-terminal ownership decisions by field. */
  private readonly terminalFieldOwners = new Map<
    MotionOwnershipField,
    MotionTerminalOwner
  >()

  /** Caches whether a field was suppressed during the previous render pass. */
  private readonly previousFieldSuppression = new Map<
    MotionOwnershipField,
    boolean
  >()

  constructor(
    config: SpatializedMotionAuthorConfig,
    options: AnimationBindingOptions = {},
  ) {
    validateSpatializedMotionConfig(config)
    this.__motionObjectId = allocateBindingId()
    this.options = options
    this.config = config
    this.configSignature = getMotionConfigSignature(config)
    this.normalizedConfig = normalizeMotionConfig(config)
    this.values = evaluateMotionTimeline(this.normalizedConfig, 0)
  }

  get configSnapshot(): SpatializedMotionAuthorConfig {
    return this.config
  }

  get normalizedConfigSnapshot(): SpatializedMotionConfig {
    return this.normalizedConfig
  }

  get currentValues(): SpatializedVisualValues {
    return this.values
  }

  get targetKind(): SpatializedMotionKind | null {
    return this.kind
  }

  get __animating(): boolean {
    return this.isAnimating
  }

  get playState(): SpatializedMotionPlayState {
    if (this.animationObject) return this.animationObject.playState
    if (this.pendingCommands.length > 0) return 'queued'
    return this.state
  }

  get isAnimating(): boolean {
    if (this.animationObject) return this.animationObject.isAnimating
    return this.isAnimatingState
  }

  get isPaused(): boolean {
    if (this.animationObject) return this.animationObject.isPaused
    return this.isPausedState
  }

  get finished(): boolean {
    if (this.animationObject) return this.animationObject.finished
    return this.finishedState
  }

  __getSuppressedFields(): Set<string> | null {
    if (
      this.kind !== 'spatialized2d' ||
      (this.state !== 'running' && this.state !== 'paused')
    ) {
      return null
    }
    return getMotionSuppressedFields(this.normalizedConfig)
  }

  __getSupportedMotionOwnershipFields(): readonly MotionOwnershipField[] {
    return this.supportedOwnershipFields
  }

  __getMotionFieldPlugin(field: MotionOwnershipField) {
    return this.fieldPlugins.get(field) ?? null
  }

  __getMotionFieldMetadata(field: MotionOwnershipField): MotionFieldMetadata {
    return {
      authoredValue: this.authoredFieldValues.get(field),
      terminalOwner: this.terminalFieldOwners.get(field) ?? null,
    }
  }

  __setMotionFieldMetadata(
    field: MotionOwnershipField,
    metadata: Partial<MotionFieldMetadata>,
  ): void {
    if ('authoredValue' in metadata) {
      this.authoredFieldValues.set(field, metadata.authoredValue)
    }
    if ('terminalOwner' in metadata) {
      this.terminalFieldOwners.set(field, metadata.terminalOwner ?? null)
    }
    this.emitMotionFieldMetadataChange(field)
  }

  __getAuthoredFieldValue(field: MotionOwnershipField): unknown {
    return this.__getMotionFieldMetadata(field)?.authoredValue
  }

  __setAuthoredFieldValue(field: MotionOwnershipField, value: unknown): void {
    this.authoredFieldValues.set(field, value)
    this.emitMotionFieldMetadataChange(field)
  }

  __getTerminalFieldOwner(field: MotionOwnershipField): MotionTerminalOwner {
    return this.__getMotionFieldMetadata(field)?.terminalOwner ?? null
  }

  __setTerminalFieldOwner(
    field: MotionOwnershipField,
    owner: MotionTerminalOwner,
  ): void {
    this.terminalFieldOwners.set(field, owner)
    this.emitMotionFieldMetadataChange(field)
  }

  __getPreviousFieldSuppression(field: MotionOwnershipField): boolean {
    return this.previousFieldSuppression.get(field) ?? false
  }

  __setPreviousFieldSuppression(
    field: MotionOwnershipField,
    suppressed: boolean,
  ): void {
    this.previousFieldSuppression.set(field, suppressed)
  }

  __getExplicitStyleOpacity(): CSSProperties['opacity'] | undefined {
    return this.__getMotionFieldMetadata('opacity')?.authoredValue as
      | CSSProperties['opacity']
      | undefined
  }

  __setExplicitStyleOpacity(
    opacity: CSSProperties['opacity'] | undefined,
  ): void {
    this.authoredFieldValues.set('opacity', opacity)
    this.emitMotionFieldMetadataChange('opacity')
  }

  __getTerminalOpacityOwner(): TerminalOpacityOwner {
    return this.__getMotionFieldMetadata('opacity')
      ?.terminalOwner as TerminalOpacityOwner
  }

  __setTerminalOpacityOwner(owner: TerminalOpacityOwner): void {
    this.terminalFieldOwners.set('opacity', owner)
    this.emitMotionFieldMetadataChange('opacity')
  }

  __getExplicitStyleTransform(): CSSProperties['transform'] | undefined {
    return this.__getMotionFieldMetadata('transform')?.authoredValue as
      | CSSProperties['transform']
      | undefined
  }

  __setExplicitStyleTransform(
    transform: CSSProperties['transform'] | undefined,
  ): void {
    this.authoredFieldValues.set('transform', transform)
    this.emitMotionFieldMetadataChange('transform')
  }

  __getTerminalTransformOwner(): TerminalTransformOwner {
    return this.__getMotionFieldMetadata('transform')
      ?.terminalOwner as TerminalTransformOwner
  }

  __setTerminalTransformOwner(owner: TerminalTransformOwner): void {
    this.terminalFieldOwners.set('transform', owner)
    this.emitMotionFieldMetadataChange('transform')
  }

  __setElement(
    element:
      | HTMLElement
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement
      | null,
    targetKind?: SpatializedMotionKind,
  ): void {
    this.bind(element, targetKind)
  }

  __onUnbind(): void {
    this.unbind()
  }

  play(): void {
    this.dispatchCommand({ type: 'play' })
  }

  pause(): void {
    this.dispatchCommand({ type: 'pause' })
  }

  resume(): void {
    this.dispatchCommand({ type: 'resume' })
  }

  stop(): void {
    this.dispatchCommand({ type: 'stop' })
  }

  reset(): void {
    this.dispatchCommand({ type: 'reset' })
  }

  finish(): void {
    this.dispatchCommand({ type: 'finish' })
  }

  updateConfig(config: SpatializedMotionAuthorConfig): void {
    validateSpatializedMotionConfig(config, {
      targetKind: this.kind ?? undefined,
    })
    const nextSignature = getMotionConfigSignature(config)
    this.config = config
    this.normalizedConfig = normalizeMotionConfig(config)
    if (nextSignature !== this.configSignature) {
      this.configSignature = nextSignature
      this.recreateAnimationObject()
    } else if (this.animationObject) {
      this.animationObject.setCallbacks(this.createAnimationObjectCallbacks())
    }
  }

  destroy(): void {
    this.destroyed = true
    this.pendingCommands = []
    this.detachAnimationObject()
    this.element = null
    this.kind = null
    this.options.onStateChange?.()
  }

  private bind(
    element:
      | HTMLElement
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement
      | null,
    targetKind?: SpatializedMotionKind,
  ): void {
    if (this.destroyed) return
    if (!element) {
      this.unbind()
      return
    }
    if (this.element && this.element !== element) {
      console.warn(
        '[AnimationBinding] motion binding already attached to another component; ignoring subsequent bind.',
      )
      return
    }
    if (targetKind) {
      if (this.kind && this.kind !== targetKind) {
        console.warn(
          `[AnimationBinding] motion binding already resolved to ${this.kind}; ignoring ${targetKind}.`,
        )
        return
      }
      validateSpatializedMotionConfig(this.config, { targetKind })
      this.kind = targetKind
    }
    this.element = element
    this.ensureAnimationObject()
    this.options.onStateChange?.()
  }

  private unbind(): void {
    if (this.destroyed) return
    this.detachAnimationObject()
    this.element = null
    this.options.onStateChange?.()
  }

  private detachAnimationObject(): void {
    const object = this.animationObject
    this.animationObject = null
    this.createToken++
    this.creating = false
    object?.destroy().catch(error => {
      this.config.onError?.({
        animationId: object.uuid,
        command: 'stop',
        reason: error instanceof Error ? error.message : 'Destroy failed',
      })
    })
    this.state = 'idle'
    this.isAnimatingState = false
    this.isPausedState = false
    this.finishedState = false
  }

  private recreateAnimationObject(): void {
    const element = this.element
    const kind = this.kind
    this.detachAnimationObject()
    if (element && kind && supportsTargetKind(kind)) {
      this.ensureAnimationObject()
      return
    }
    this.values = evaluateMotionTimeline(this.normalizedConfig, 0)
    this.options.onValuesChange?.(this.values)
    this.options.onStateChange?.()
  }

  private ensureAnimationObject(): void {
    if (
      this.animationObject ||
      this.creating ||
      !this.kind ||
      !this.element ||
      !this.isAnimationElement(this.element)
    ) {
      return
    }
    if (!supportsTargetKind(this.kind)) {
      return
    }
    const hadPendingCommands = this.pendingCommands.length > 0
    const token = ++this.createToken
    const element = this.element
    const kind = this.kind

    this.creating = true
    element
      .createAnimation(this.config)
      .then(animationObject => {
        if (
          this.destroyed ||
          token !== this.createToken ||
          this.element !== element ||
          this.kind !== kind
        ) {
          animationObject.destroy().catch(() => {})
          return
        }

        this.animationObject = animationObject
        this.creating = false
        animationObject.setCallbacks(this.createAnimationObjectCallbacks())
        this.syncStateFromAnimationObject()
        this.flushPendingCommands()
        this.maybeAutoPlay(!hadPendingCommands)
        this.options.onStateChange?.()
      })
      .catch(error => {
        if (token !== this.createToken) return
        this.creating = false
        this.config.onError?.({
          animationId: this.__motionObjectId,
          command: 'play',
          reason: error instanceof Error ? error.message : 'Create failed',
        })
        this.options.onStateChange?.()
      })
  }

  private isAnimationElement(
    element:
      | HTMLElement
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement,
  ): element is AnimationTargetElement {
    return (
      typeof (element as { createAnimation?: unknown }).createAnimation ===
      'function'
    )
  }

  private createAnimationObjectCallbacks() {
    return {
      onStart: this.config.onStart,
      onComplete: this.config.onComplete,
      onStop: this.config.onStop,
      onReset: this.config.onReset,
      onError: this.config.onError,
      onValuesChange: (values: SpatializedVisualValues) => {
        this.values = values
        this.options.onValuesChange?.(values)
      },
      onStateChange: () => {
        this.syncStateFromAnimationObject()
        this.options.onStateChange?.()
      },
    }
  }

  private syncStateFromAnimationObject(): void {
    if (!this.animationObject) return
    this.state = this.animationObject.playState
    this.isAnimatingState = this.animationObject.isAnimating
    this.isPausedState = this.animationObject.isPaused
    this.finishedState = this.animationObject.finished
  }

  private dispatchCommand(command: AnimationCommand): void {
    if (this.destroyed) return
    if (!this.animationObject || !this.element || !this.kind) {
      this.pendingCommands.push(command)
      this.applyQueuedState(command)
      this.options.onStateChange?.()
      return
    }
    this.animationObject[command.type]().catch(error => {
      this.config.onError?.({
        animationId: this.animationObject?.uuid ?? this.__motionObjectId,
        command: command.type,
        reason: error instanceof Error ? error.message : 'Command failed',
      })
    })
    this.syncStateFromAnimationObject()
    this.options.onStateChange?.()
  }

  private applyQueuedState(command: AnimationCommand): void {
    switch (command.type) {
      case 'play':
      case 'resume':
        this.state = 'queued'
        this.isAnimatingState = true
        this.isPausedState = false
        this.finishedState = false
        break
      case 'pause':
        this.state = 'queued'
        this.isAnimatingState = false
        this.isPausedState = true
        break
      case 'stop':
      case 'reset':
        this.state = 'queued'
        this.isAnimatingState = false
        this.isPausedState = false
        this.finishedState = false
        break
      case 'finish':
        this.state = 'queued'
        this.isAnimatingState = false
        this.isPausedState = false
        this.finishedState = false
        break
    }
  }

  private flushPendingCommands(): void {
    if (!this.animationObject || !this.element || !this.kind) return
    const commands = this.pendingCommands
    this.pendingCommands = []
    for (const command of commands) {
      this.animationObject[command.type]().catch(error => {
        this.config.onError?.({
          animationId: this.animationObject?.uuid ?? this.__motionObjectId,
          command: command.type,
          reason: error instanceof Error ? error.message : 'Command failed',
        })
      })
    }
    this.syncStateFromAnimationObject()
  }

  private maybeAutoPlay(allowImplicitPlay: boolean): void {
    if (!this.animationObject || !this.element || !this.kind) return
    if (!allowImplicitPlay) return
    if (this.config.autoStart === false) return
    this.animationObject.play().catch(error => {
      this.config.onError?.({
        animationId: this.animationObject?.uuid ?? this.__motionObjectId,
        command: 'play',
        reason: error instanceof Error ? error.message : 'Play failed',
      })
    })
    this.syncStateFromAnimationObject()
  }

  private emitMotionFieldMetadataChange(field: MotionOwnershipField): void {
    const metadata = this.__getMotionFieldMetadata(field)
    if (!metadata) return
    this.options.onMotionFieldMetadataChange?.(field, metadata)
    if (field === 'opacity') {
      this.options.onExplicitStyleOpacityChange?.(
        metadata.authoredValue as CSSProperties['opacity'] | undefined,
      )
      this.options.onTerminalOpacityOwnerChange?.(
        metadata.terminalOwner as TerminalOpacityOwner,
      )
      return
    }
    if (field === 'transform') {
      this.options.onExplicitStyleTransformChange?.(
        metadata.authoredValue as CSSProperties['transform'] | undefined,
      )
      this.options.onTerminalTransformOwnerChange?.(
        metadata.terminalOwner as TerminalTransformOwner,
      )
    }
  }
}

export function createMotionBinding(
  config: SpatializedMotionConfig,
  options?: AnimationBindingOptions,
): AnimationBinding {
  return new AnimationBinding(config, options)
}
