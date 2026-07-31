import type {
  EntityAnimationObject,
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
  EntityTransformUpdate,
  SpatialEntity,
  SpatializedMotionPlayState,
  SpatializedPlaybackError,
} from '@webspatial/core-sdk'
import { validateEntityTransformUpdate } from '@webspatial/core-sdk'
import {
  getEntityMotionExecutionSignature,
  setEntityAnimationAndWait,
} from '@webspatial/core-sdk/internal/entity-motion'

type PlaybackCommandType = 'play' | 'pause' | 'stop' | 'reset' | 'finish'

type EntityMotionCommand =
  | { type: PlaybackCommandType }
  | { type: 'set'; update: EntityTransformUpdate }

interface EntityMotionReplacement {
  /** Animation object retained as current while destruction is pending. */
  object: EntityAnimationObject
  /** Binding generation retained as current while destruction is pending. */
  generation: number
  /** Commands owned by the replacement generation. */
  commands: EntityMotionCommand[]
  /** Whether native destruction has begun after the old command tail. */
  destroyStarted: boolean
  /** Whether Native already reported the replacement failure. */
  errorReported: boolean
}

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
  /** Normalized signature requested by the latest render. */
  private desiredSignature: string
  /** Normalized signature represented by the current creation or object. */
  private activeSignature: string
  /** Currently bound Core Entity target. */
  private target: SpatialEntity | null = null
  /** Current Core Entity animation object. */
  private animationObject: EntityAnimationObject | null = null
  /** Commands waiting for native object creation. */
  private pendingCommands: EntityMotionCommand[] = []
  /** Serialized command tail for the current binding generation. */
  private commandTail: Promise<void> = Promise.resolve()
  /** Monotonic epoch that invalidates unsent commands independently of events. */
  private commandEpoch = 0
  /** Monotonic binding generation used to reject stale work. */
  private generation = 0
  /** Whether creation failure terminated the current binding lifecycle. */
  private terminated = false
  /** Same-target replacement currently waiting for old-object destruction. */
  private replacement: EntityMotionReplacement | null = null
  /** Failed replacement signature suppressed until authoring changes again. */
  private failedReplacementSignature: string | null = null
  /** Whether the latest committed config contains an already-warned declaration conflict. */
  private precedenceDeclarationActive = false
  /** Native-confirmed or creation-pending playback state. */
  private state: SpatializedMotionPlayState = 'idle'
  /** Complete Native-confirmed Entity transform mirror. */
  private confirmedValues: EntityMotionProps = {}
  /** React render subscribers. */
  private readonly listeners = new Set<() => void>()
  /** External-store revision advanced for every observable change. */
  private revision = 0

  /** Creates one stable binding and its public playback facade. */
  constructor(config: EntityMotionConfig) {
    this.config = config
    this.desiredSignature = getEntityMotionExecutionSignature(config)
    this.activeSignature = this.desiredSignature
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
    this.config = config
    this.desiredSignature = getEntityMotionExecutionSignature(config)
  }

  /** Reconciles committed config changes without mutating during render. */
  reconcileConfig(): void {
    if (
      this.terminated ||
      this.replacement ||
      !this.target ||
      !this.animationObject ||
      this.desiredSignature === this.failedReplacementSignature ||
      this.desiredSignature === this.activeSignature
    ) {
      return
    }
    this.startReplacement(this.animationObject, this.generation)
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
    this.failedReplacementSignature = null
    this.activeSignature = this.desiredSignature
    if (this.config.autoStart !== false) {
      this.pendingCommands.unshift({ type: 'play' })
    }
    this.state = this.pendingCommands.length > 0 ? 'queued' : 'idle'
    this.notify()
    this.createAnimationObject(entity, generation)
  }

  /** Unbinds the target, invalidates queued work, clears values, and destroys Native state. */
  __unbind(): void {
    ++this.generation
    const object = this.animationObject
    this.target = null
    this.animationObject = null
    this.pendingCommands = []
    ++this.commandEpoch
    this.commandTail = Promise.resolve()
    this.terminated = false
    this.failedReplacementSignature = null
    const replacement = this.replacement
    this.replacement = null
    this.state = 'idle'
    this.confirmedValues = {}
    this.notify()
    if (object && (!replacement || !replacement.destroyStarted)) {
      void object.destroy().catch(() => {})
    }
  }

  /** Starts one deduplicated replacement while retaining the old object. */
  private startReplacement(
    object: EntityAnimationObject,
    generation: number,
  ): void {
    const replacement: EntityMotionReplacement = {
      object,
      generation,
      commands: [],
      destroyStarted: false,
      errorReported: false,
    }
    this.replacement = replacement
    this.failedReplacementSignature = null
    const oldTail = this.commandTail
    ++this.commandEpoch
    this.commandTail = Promise.resolve()
    void oldTail
      .then(async () => {
        if (this.replacement !== replacement) return
        replacement.destroyStarted = true
        try {
          await object.destroy()
        } catch (error) {
          this.handleReplacementDestroyFailure(replacement, error)
          return
        }
        await this.completeReplacement(replacement)
      })
      .catch(error => {
        this.terminateReplacement(error)
      })
  }

  /** Hands off a complete confirmed pose and creates the latest replacement. */
  private async completeReplacement(
    replacement: EntityMotionReplacement,
  ): Promise<void> {
    if (
      this.replacement !== replacement ||
      this.animationObject !== replacement.object ||
      this.generation !== replacement.generation
    ) {
      return
    }
    const entity = this.target
    if (!entity) return

    this.animationObject = null
    this.state =
      replacement.commands.length > 0 || this.config.autoStart !== false
        ? 'queued'
        : 'idle'
    this.notify()
    if (this.hasCompleteConfirmedPose()) {
      try {
        await entity.updateTransform(this.confirmedValues)
      } catch (error) {
        this.terminateReplacement(error)
        return
      }
    }
    if (this.replacement !== replacement || this.target !== entity) return

    const generation = ++this.generation
    const config = this.config
    const signature = this.desiredSignature
    this.activeSignature = signature
    this.pendingCommands = replacement.commands
    if (config.autoStart !== false) {
      this.pendingCommands.unshift({ type: 'play' })
    }
    this.state = this.pendingCommands.length > 0 ? 'queued' : 'idle'
    this.replacement = null
    this.failedReplacementSignature = null
    this.notify()
    this.createAnimationObject(entity, generation, config, signature)
  }

  /** Retains the old object after destruction fails and drops replacement commands. */
  private handleReplacementDestroyFailure(
    replacement: EntityMotionReplacement,
    error: unknown,
  ): void {
    if (
      this.replacement !== replacement ||
      this.animationObject !== replacement.object ||
      this.generation !== replacement.generation
    ) {
      return
    }
    replacement.commands = []
    this.replacement = null
    this.failedReplacementSignature = this.desiredSignature
    this.state = replacement.object.playState
    if (!replacement.errorReported) {
      replacement.errorReported = true
      this.config.onError?.({
        code: 'ANIMATION_NOT_FOUND',
        reason:
          error instanceof Error
            ? error.message
            : 'DestroyEntityAnimation failed',
      })
    }
    this.notify()
  }

  /** Terminates the current lifecycle after replacement handoff fails. */
  private terminateReplacement(error: unknown): void {
    if (!this.replacement) return
    ++this.generation
    ++this.commandEpoch
    this.animationObject = null
    this.pendingCommands = []
    this.commandTail = Promise.resolve()
    this.replacement = null
    this.failedReplacementSignature = null
    this.confirmedValues = {}
    this.state = 'idle'
    this.terminated = true
    this.config.onError?.({
      code: 'COMPILATION_FAILED',
      reason:
        error instanceof Error ? error.message : 'Entity pose handoff failed',
    })
    this.notify()
  }

  /** Returns whether the confirmed mirror contains one complete Entity pose. */
  private hasCompleteConfirmedPose(): boolean {
    const { position, rotation, scale } = this.confirmedValues
    return Boolean(
      position &&
        rotation &&
        scale &&
        typeof position.x === 'number' &&
        typeof position.y === 'number' &&
        typeof position.z === 'number' &&
        typeof rotation.x === 'number' &&
        typeof rotation.y === 'number' &&
        typeof rotation.z === 'number' &&
        typeof scale.x === 'number' &&
        typeof scale.y === 'number' &&
        typeof scale.z === 'number',
    )
  }

  /** Starts native object creation for one guarded binding generation. */
  private createAnimationObject(
    entity: SpatialEntity,
    generation: number,
    config: EntityMotionConfig = this.config,
    signature: string = this.desiredSignature,
  ): void {
    let creationErrorReported = false
    const creationConfig: EntityMotionConfig = {
      ...config,
      onError: error => {
        if (generation !== this.generation || creationErrorReported) return
        creationErrorReported = true
        this.config.onError?.(error)
      },
    }

    entity
      .createAnimation(creationConfig)
      .then(object => {
        if (generation !== this.generation || this.target !== entity) {
          void object.destroy().catch(() => {})
          return
        }
        this.animationObject = object
        this.activeSignature = signature
        this.registerAnimationObject(object, generation)
        this.state = 'idle'
        this.notify()
        const commands = this.pendingCommands
        this.pendingCommands = []
        for (const command of commands) {
          this.enqueueCommand(command, object, generation)
        }
        this.reconcileConfig()
      })
      .catch(error => {
        if (generation !== this.generation || this.target !== entity) return
        this.animationObject = null
        this.pendingCommands = []
        this.commandTail = Promise.resolve()
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
      })
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
      const replacement = this.replacement
      if (
        replacement?.object === object &&
        replacement.generation === generation
      ) {
        if (replacement.errorReported) return
        replacement.errorReported = true
      }
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
    if (this.replacement) {
      this.replacement.commands.push(command)
      this.state = 'queued'
      this.notify()
      return
    }
    const object = this.animationObject
    if (!object) {
      this.pendingCommands.push(command)
      this.state = 'queued'
      this.notify()
      return
    }
    this.enqueueCommand(command, object, this.generation)
  }

  /** Dispatches a set command only after native object creation. */
  private dispatchSet(update: EntityTransformUpdate): void {
    validateEntityTransformUpdate(update)
    if (this.terminated) {
      console.warn('[useEntityAnimation] set ignored after creation failure')
      return
    }
    if (this.replacement) {
      console.warn(
        '[useEntityAnimation] set ignored before Entity animation creation',
      )
      return
    }
    const object = this.animationObject
    if (!object) {
      console.warn(
        '[useEntityAnimation] set ignored before Entity animation creation',
      )
      return
    }
    void this.enqueueCommand({ type: 'set', update }, object, this.generation)
  }

  /** Appends one command to the failure-isolated FIFO chain. */
  private enqueueCommand(
    command: EntityMotionCommand,
    object: EntityAnimationObject,
    generation: number,
  ): Promise<void> {
    const commandEpoch = this.commandEpoch
    const run = async (): Promise<void> => {
      if (
        commandEpoch !== this.commandEpoch ||
        generation !== this.generation ||
        this.animationObject !== object ||
        this.terminated
      ) {
        return
      }
      try {
        if (command.type === 'set') {
          await setEntityAnimationAndWait(object, command.update)
        } else {
          await object[command.type]()
        }
      } catch (error) {
        if (generation === this.generation && this.animationObject === object) {
          this.reportCommandError(error)
        }
      }
    }
    const result = this.commandTail.then(run, run)
    this.commandTail = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  /** Reports one ordinary rejected command without terminating the FIFO. */
  private reportCommandError(error: unknown): void {
    const playbackError: SpatializedPlaybackError = {
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
