import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
  EntityPlaybackError,
  EntityTransformUpdate,
  SpatialEntity,
  SpatializedMotionPlayState,
} from '@webspatial/core-sdk'

/** Core animation handle type inferred from the target creation entry. */
type EntityAnimationObject = Awaited<
  ReturnType<SpatialEntity['createAnimation']>
>

type PlaybackCommandType = 'play' | 'pause' | 'stop' | 'reset' | 'finish'

type EntityMotionCommand = { type: PlaybackCommandType }

declare const entityMotionAnimationBrand: unique symbol

/** Opaque Entity animation prop consumed by Reality Entity components. */
export interface EntityMotionAnimation {
  /** Compile-time-only brand that keeps the animation prop opaque. */
  readonly [entityMotionAnimationBrand]: true
}

/** Internal binding operations consumed only by the Reality entity layer. */
export interface EntityMotionBindingInternal {
  /** Binds this animation to one Core SpatialEntity. */
  __bind(entity: SpatialEntity): void
  /** Unbinds the current Core SpatialEntity and releases the native object. */
  __unbind(): void
}

/** React coordination object for one Entity motion hook instance. */
export class EntityMotionBinding implements EntityMotionBindingInternal {
  /** Stable public playback facade. */
  readonly api: EntityPlaybackApi

  /** Latest public configuration and callback references. */
  private config: EntityMotionConfig
  /** Latest committed React config revision. */
  private configRevision = 0
  /** Latest config revision handed to Core. */
  private reconciledConfigRevision = 0
  /** Currently bound Core Entity target. */
  private target: SpatialEntity | null = null
  /** Current Core Entity animation object. */
  private animationObject: EntityAnimationObject | null = null
  /** Commands waiting for native object creation. */
  private pendingCommands: EntityMotionCommand[] = []
  /** Monotonic binding generation used to reject stale work. */
  private generation = 0
  /** Whether creation failure terminated the current binding lifecycle. */
  private terminated = false
  /** Whether the latest committed config contains an already-warned declaration conflict. */
  private precedenceDeclarationActive = false
  /** Native-confirmed or creation-pending playback state. */
  private state: SpatializedMotionPlayState = 'idle'
  /** Complete Native-confirmed Entity transform mirror. */
  private confirmedValues: EntityMotionProps = {}
  /** Core programmer error rethrown by the Hook during render. */
  private pendingSynchronousError: Error | null = null
  /** React render subscribers. */
  private readonly listeners = new Set<() => void>()
  /** External-store revision advanced for every observable change. */
  private revision = 0

  /** Creates one stable binding and its public playback facade. */
  constructor(config: EntityMotionConfig) {
    this.config = config
    const thisBinding = this
    this.api = {
      play: () => this.dispatchPlayback('play'),
      pause: () => this.dispatchPlayback('pause'),
      stop: () => this.dispatchPlayback('stop'),
      reset: () => this.dispatchPlayback('reset'),
      finish: () => this.dispatchPlayback('finish'),
      set: update => this.dispatchSet(update),
      get playState() {
        return thisBinding.state
      },
      get isAnimating() {
        return thisBinding.state === 'running'
      },
      get isPaused() {
        return thisBinding.state === 'paused'
      },
      get finished() {
        return thisBinding.state === 'finished'
      },
    }
  }

  /** Returns the current immutable-by-replacement confirmed transform mirror. */
  get entityProps(): EntityMotionProps {
    return this.confirmedValues
  }

  /** Returns the Core programmer error waiting for React error-boundary delivery. */
  get synchronousError(): Error | null {
    return this.pendingSynchronousError
  }

  /** Replaces authoring and callback references for subsequent work. */
  updateConfig(config: EntityMotionConfig): void {
    const hasPrecedenceDeclaration =
      config.timeline !== undefined &&
      (config.from !== undefined || config.to !== undefined)
    if (hasPrecedenceDeclaration && !this.precedenceDeclarationActive) {
      console.warn(
        '[useEntityAnimation] timeline takes precedence; top-level from/to are ignored',
      )
    }
    this.precedenceDeclarationActive = hasPrecedenceDeclaration
    if (this.config !== config) {
      this.configRevision += 1
    }
    this.config = config
  }

  /** Reconciles committed config changes without mutating during render. */
  reconcileConfig(): void {
    if (
      this.terminated ||
      !this.target ||
      !this.animationObject ||
      this.reconciledConfigRevision === this.configRevision
    ) {
      return
    }
    this.reconciledConfigRevision = this.configRevision
    const object = this.animationObject
    const generation = this.generation
    try {
      void object.update(this.config).catch(error => {
        if (generation === this.generation && this.animationObject === object) {
          this.reportCommandError(error)
        }
      })
    } catch (error) {
      this.pendingSynchronousError =
        error instanceof Error ? error : new Error(String(error))
      this.notify()
    }
  }

  /** Subscribes a React consumer to state or confirmed-value changes. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Returns the current external-store revision. */
  getSnapshot = (): number => this.revision

  /** Binds this animation to exactly one Core Entity target. */
  __bind(entity: SpatialEntity): void {
    if (this.target && this.target !== entity) {
      throw new Error(
        '[useEntityAnimation] The same animation object must not be bound to multiple entities.',
      )
    }
    if (this.target === entity) return

    const generation = ++this.generation
    this.target = entity
    this.terminated = false
    if (this.config.autoStart !== false) {
      this.pendingCommands.unshift({ type: 'play' })
    }
    this.state = this.pendingCommands.length > 0 ? 'queued' : 'idle'
    this.notify()
    try {
      this.createAnimationObject(entity, generation)
    } catch (error) {
      // Synchronous Core validation must leave no partially established binding behind.
      if (generation === this.generation && this.target === entity) {
        this.target = null
        this.animationObject = null
        this.pendingCommands = []
        ++this.generation
        this.terminated = false
        this.state = 'idle'
        this.confirmedValues = {}
        this.pendingSynchronousError = null
        this.notify()
      }
      throw error
    }
  }

  /** Unbinds the target, invalidates queued work, clears values, and destroys Native state. */
  __unbind(): void {
    ++this.generation
    const object = this.animationObject
    this.target = null
    this.animationObject = null
    this.pendingCommands = []
    this.terminated = false
    this.state = 'idle'
    this.confirmedValues = {}
    this.pendingSynchronousError = null
    this.notify()
    if (object) {
      void object.destroy().catch(() => {})
    }
  }

  /** Starts native object creation for one guarded binding generation. */
  private createAnimationObject(
    entity: SpatialEntity,
    generation: number,
  ): void {
    const config = this.config
    const creationConfigRevision = this.configRevision
    let creationErrorReported = false
    const creationConfig: EntityMotionConfig = {
      ...config,
      onError: error => {
        if (generation !== this.generation || creationErrorReported) return
        creationErrorReported = true
        this.config.onError?.(error)
      },
    }
    const handleFailure = (error: unknown): void => {
      if (generation !== this.generation || this.target !== entity) return
      this.animationObject = null
      this.pendingCommands = []
      this.confirmedValues = {}
      this.state = 'idle'
      this.terminated = true
      if (!creationErrorReported) {
        creationErrorReported = true
        this.config.onError?.({
          code: 'COMPILATION_FAILED',
          reason:
            error instanceof Error
              ? error.message
              : 'CreateEntityAnimation failed',
        })
      }
      this.notify()
    }
    const creation = entity.createAnimation(creationConfig)
    creation
      .then(object => {
        if (generation !== this.generation || this.target !== entity) {
          void object.destroy().catch(() => {})
          return
        }
        this.animationObject = object
        this.reconciledConfigRevision = creationConfigRevision
        this.registerAnimationObject(object, generation)
        this.state = 'idle'
        this.notify()
        const commands = this.pendingCommands
        this.pendingCommands = []
        for (const command of commands) {
          this.runPlaybackCommand(command.type, object, generation)
        }
        this.reconcileConfig()
      })
      .catch(handleFailure)
  }

  /** Registers all object-level state, value, and error observers. */
  private registerAnimationObject(
    object: EntityAnimationObject,
    generation: number,
  ): void {
    const isCurrent = () =>
      generation === this.generation && this.animationObject === object
    object.onPlayStateChange(state => {
      if (!isCurrent()) return
      this.state = state
      this.notify()
    })
    object.onStart(values => {
      if (!isCurrent()) return
      this.config.onStart?.(values)
    })
    object.onComplete(values => {
      if (!isCurrent()) return
      this.config.onComplete?.(values)
    })
    object.onStop(values => {
      if (!isCurrent()) return
      this.config.onStop?.(values)
    })
    object.onReset(values => {
      if (!isCurrent()) return
      this.config.onReset?.(values)
    })
    object.onError(error => {
      if (!isCurrent()) return
      this.config.onError?.(error)
    })
    object.onValuesChange(values => {
      if (!isCurrent()) return
      this.confirmedValues = values
      this.notify()
    })
  }

  /** Dispatches one playback command or queues it before object creation. */
  private dispatchPlayback(type: PlaybackCommandType): void {
    if (this.terminated) {
      console.warn(
        `[useEntityAnimation] ${type} ignored after creation failure`,
      )
      return
    }
    const command: EntityMotionCommand = { type }
    const object = this.animationObject
    if (!object) {
      this.pendingCommands.push(command)
      this.state = 'queued'
      this.notify()
      return
    }
    this.runPlaybackCommand(type, object, this.generation)
  }

  /** Dispatches a set command only after native object creation. */
  private dispatchSet(update: EntityTransformUpdate): void {
    if (this.terminated) {
      console.warn('[useEntityAnimation] set ignored after creation failure')
      return
    }
    const object = this.animationObject
    if (!object) {
      console.warn(
        '[useEntityAnimation] set ignored before Entity animation creation',
      )
      return
    }
    const generation = this.generation
    void object.set(update).catch(error => {
      if (generation === this.generation && this.animationObject === object) {
        this.reportCommandError(error)
      }
    })
  }

  /** Delegates one playback command to the Core object after creation. */
  private runPlaybackCommand(
    type: PlaybackCommandType,
    object: EntityAnimationObject,
    generation: number,
  ): void {
    if (
      generation !== this.generation ||
      this.animationObject !== object ||
      this.terminated
    ) {
      return
    }
    void object[type]().catch(error => {
      if (generation === this.generation && this.animationObject === object) {
        this.reportCommandError(error)
      }
    })
  }

  /** Reports one asynchronous rejected command. */
  private reportCommandError(error: unknown): void {
    const playbackError: EntityPlaybackError = {
      code: 'COMPILATION_FAILED',
      reason:
        error instanceof Error ? error.message : 'Entity motion command failed',
    }
    this.config.onError?.(playbackError)
  }

  /** Notifies every current React subscriber. */
  private notify(): void {
    this.revision += 1
    for (const listener of this.listeners) {
      listener()
    }
  }
}
