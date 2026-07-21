import type {
  SpatializedElement,
  SpatializedMotionConfig,
  SpatializedMotionKind,
  SpatializedMotionPlayState,
  SpatializedPlaybackApi,
  SpatializedPlaybackError,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import { supports, validateSpatializedMotionConfig } from '@webspatial/core-sdk'
import { getMotionConfigSignature } from './motionConfigSignature'

/** Internal animation object returned by a spatialized element. */
type AnimationObject = Awaited<
  ReturnType<SpatializedElement['createAnimation']>
>

type AnimationCommandType = 'play' | 'pause' | 'stop' | 'reset' | 'finish'

type AnimationCommand = {
  type: AnimationCommandType
}

interface AnimationBindingOptions {
  onValuesChange?: (values: SpatializedVisualValues) => void
  onStateChange?: () => void
}

function supportsAnimation(): boolean {
  return supports('useAnimation')
}

/**
 * React-owned binding for spatialized motion.
 */
export class AnimationBinding implements SpatializedPlaybackApi {
  readonly __kind = 'spatializedMotion' as const

  private animationObject: AnimationObject | null = null
  private element: SpatializedElement | null = null
  private destroyed = false
  private creating = false
  private createToken = 0
  private pendingCommands: AnimationCommand[] = []
  private configSignature: string
  private config: SpatializedMotionConfig
  private values: SpatializedVisualValues
  private state: SpatializedMotionPlayState = 'idle'
  private isAnimatingState = false
  private isPausedState = false
  private finishedState = false
  private readonly options: AnimationBindingOptions

  constructor(
    config: SpatializedMotionConfig,
    options: AnimationBindingOptions = {},
  ) {
    validateSpatializedMotionConfig(config)
    this.options = options
    this.config = config
    this.configSignature = getMotionConfigSignature(config)
    // Keep the fallback snapshot empty after removing timeline sampling utilities.
    this.values = {}
  }

  get configSnapshot(): SpatializedMotionConfig {
    return this.config
  }

  get currentValues(): SpatializedVisualValues {
    return this.values
  }

  get targetKind(): SpatializedMotionKind | null {
    return this.element?.kind ?? null
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

  __setElement(element: SpatializedElement | null): void {
    this.bind(element)
  }

  __onUnbind(element: SpatializedElement): void {
    this.unbind(element)
  }

  play(): void {
    this.dispatchCommand({ type: 'play' })
  }

  pause(): void {
    this.dispatchCommand({ type: 'pause' })
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

  updateConfig(config: SpatializedMotionConfig): void {
    validateSpatializedMotionConfig(config)
    const nextSignature = getMotionConfigSignature(config)
    this.config = config
    if (nextSignature !== this.configSignature) {
      this.configSignature = nextSignature
      this.recreateAnimationObject()
    } else if (this.animationObject) {
      this.animationObject.setCallbacks(
        this.createAnimationObjectCallbacks(this.animationObject),
      )
    }
  }

  destroy(): void {
    this.destroyed = true
    this.pendingCommands = []
    this.detachAnimationObject()
    this.element = null
    this.options.onStateChange?.()
  }

  private bind(element: SpatializedElement | null): void {
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
    validateSpatializedMotionConfig(this.config)
    this.element = element
    this.ensureAnimationObject()
    this.options.onStateChange?.()
  }

  private unbind(element?: SpatializedElement): void {
    if (this.destroyed) return
    if (element && this.element !== element) return
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
        command: 'destroy',
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
    this.detachAnimationObject()
    if (element && supportsAnimation()) {
      this.ensureAnimationObject()
      return
    }
    // Keep the fallback snapshot empty after removing timeline sampling utilities.
    this.values = {}
    this.options.onValuesChange?.(this.values)
    this.options.onStateChange?.()
  }

  private ensureAnimationObject(): void {
    if (this.animationObject || this.creating || !this.element) {
      return
    }
    if (!supportsAnimation()) {
      return
    }
    const token = ++this.createToken
    const element = this.element
    const kind = element.kind

    this.creating = true
    element
      .createAnimation(this.config)
      .then(async animationObject => {
        if (
          this.destroyed ||
          token !== this.createToken ||
          this.element !== element ||
          this.element.kind !== kind
        ) {
          animationObject.destroy().catch(() => {})
          return
        }

        this.animationObject = animationObject
        this.creating = false
        animationObject.setCallbacks(
          this.createAnimationObjectCallbacks(animationObject),
        )
        this.syncStateFromAnimationObject()
        if (this.config.autoStart !== false) {
          this.pendingCommands.unshift({ type: 'play' })
        }
        await this.flushPendingCommands()
        if (
          this.destroyed ||
          token !== this.createToken ||
          this.animationObject !== animationObject ||
          this.element !== element ||
          this.element.kind !== kind
        ) {
          return
        }
        this.options.onStateChange?.()
      })
      .catch(error => {
        if (token !== this.createToken) return
        this.creating = false
        this.pendingCommands = []
        this.state = 'idle'
        this.isAnimatingState = false
        this.isPausedState = false
        this.finishedState = false
        this.config.onError?.({
          command: 'create',
          reason: error instanceof Error ? error.message : 'Create failed',
        })
        this.options.onStateChange?.()
      })
  }

  private createAnimationObjectCallbacks(animationObject: AnimationObject) {
    // Ignore delayed callbacks after unbind or animation object replacement.
    const isCurrent = () =>
      !this.destroyed && this.animationObject === animationObject
    return {
      onStart: () => {
        if (!isCurrent()) return
        this.config.onStart?.()
      },
      onComplete: (values: SpatializedVisualValues) => {
        if (!isCurrent()) return
        this.config.onComplete?.(values)
      },
      onStop: (values: SpatializedVisualValues) => {
        if (!isCurrent()) return
        this.config.onStop?.(values)
      },
      onReset: (values: SpatializedVisualValues) => {
        if (!isCurrent()) return
        this.config.onReset?.(values)
      },
      onError: (error: SpatializedPlaybackError) => {
        if (!isCurrent()) return
        this.config.onError?.(error)
      },
      onValuesChange: (values: SpatializedVisualValues) => {
        if (!isCurrent()) return
        this.values = values
        this.options.onValuesChange?.(values)
      },
      onStateChange: () => {
        if (!isCurrent()) return
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
    if (!this.animationObject || !this.element) {
      this.pendingCommands.push(command)
      this.applyQueuedState(command)
      this.options.onStateChange?.()
      return
    }
    this.animationObject[command.type]().catch(error => {
      this.config.onError?.({
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

  private async flushPendingCommands(): Promise<void> {
    if (!this.animationObject || !this.element) return
    const animationObject = this.animationObject
    const commands = this.pendingCommands
    this.pendingCommands = []
    for (const command of commands) {
      try {
        await animationObject[command.type]()
      } catch (error) {
        this.config.onError?.({
          command: command.type,
          reason: error instanceof Error ? error.message : 'Command failed',
        })
      }
      if (
        this.destroyed ||
        this.animationObject !== animationObject ||
        !this.element
      ) {
        return
      }
    }
    this.syncStateFromAnimationObject()
  }
}
