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
  normalizeMotionConfig,
  supports,
  validateSpatializedMotionConfig,
} from '@webspatial/core-sdk'
import { getMotionConfigSignature } from './motionConfigSignature'

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
 */
export class AnimationBinding implements SpatializedPlaybackApi {
  readonly __kind = 'spatializedMotion' as const
  /** Stable fallback id used when a native animation object is not available. */
  private readonly motionObjectId: string

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

  constructor(
    config: SpatializedMotionAuthorConfig,
    options: AnimationBindingOptions = {},
  ) {
    validateSpatializedMotionConfig(config)
    this.motionObjectId = allocateBindingId()
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
    this.createToken += 1
    this.creating = false
    object?.destroy().catch(error => {
      this.config.onError?.({
        animationId: object.id,
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
          animationId: this.motionObjectId,
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
        animationId: this.animationObject?.id ?? this.motionObjectId,
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
          animationId: this.animationObject?.id ?? this.motionObjectId,
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
        animationId: this.animationObject?.id ?? this.motionObjectId,
        command: 'play',
        reason: error instanceof Error ? error.message : 'Play failed',
      })
    })
    this.syncStateFromAnimationObject()
  }
}