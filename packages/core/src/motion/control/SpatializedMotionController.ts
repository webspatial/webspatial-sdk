import type { SpatializedMotionKind } from '../../types/spatializedMotion'
import type { SpatializedMotionHandle } from './SpatializedMotionHandle'
import { MOTION_KIND_POLICIES, type MotionKindPolicy } from './motionKindPolicy'
import type { MotionHost } from './MotionHost'
import {
  resolverFromOptions,
  type CapabilityResolver,
} from './CapabilityResolver'
import { WebPlaybackBackend } from './WebPlaybackBackend'
import { NativePlaybackBackend } from './NativePlaybackBackend'
import type { PlaybackBackend } from './PlaybackBackend'
import { Sampler } from './Sampler'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type {
  SpatializedMotionConfig,
  SpatializedMotionPlayState,
  SpatializedMotionPropertyKeys,
} from '../../types/spatializedMotion'
import { evaluateMotionTimeline } from '../compute/sample'
import { validateSpatializedMotionConfig } from '../compute/validate'

export interface SpatializedMotionControllerOptions {
  /** Initial element; may be set later via {@link attachElement}. */
  element?: MotionHost | null
  /**
   * When set, overrides `supports('useAnimation', [kind])` for backend selection.
   * Existing native element controllers can keep using this for tests.
   */
  forceNativePlayback?: boolean
  /** Fired when sampled values should update a style outlet. */
  onValuesChange?: (values: SpatializedVisualValues) => void
  /** Fired when {@link playState} changes (e.g. React re-render). */
  onStateChange?: () => void
  /** Optional backend capability resolver, used by React tests to mock support checks. */
  supportsMotionKind?: (kind: SpatializedMotionKind) => boolean
}

let _motionObjectCounter = 0
function nextMotionObjectId(prefix: string): string {
  return `${prefix}${++_motionObjectCounter}_${Date.now()}`
}

const CONTROLLER_LABEL = 'SpatializedMotionController'

/**
 * Runtime controller for a spatialized element motion timeline.
 *
 * Facade over a single playback strategy (Strategy pattern). The backend is
 * chosen lazily — exactly once, when the motion `kind` becomes known — between
 * the raf-driven {@link WebPlaybackBackend} and the native-session
 * {@link NativePlaybackBackend}. Both implement the common
 * {@link PlaybackBackend} abstraction, so the controller only ever talks to the
 * interface and stays unaware of the web/native distinction. While the kind is
 * still unresolved the backend is `null` and the controller handles the verbs
 * itself (queueing a pending play, seeking start/end via the timeline).
 */
export class SpatializedMotionController implements SpatializedMotionHandle {
  readonly id: string

  private kind: SpatializedMotionKind | null
  private config: SpatializedMotionConfig
  private element: MotionHost | null
  private readonly onValuesChange?: (values: SpatializedVisualValues) => void
  private readonly onStateChange?: () => void

  /** Shared visual sampler / freeze registry (used by whichever backend wins). */
  private readonly sampler: Sampler
  /**
   * The single chosen playback strategy, or `null` until the motion `kind`
   * resolves. The controller only ever sees the {@link PlaybackBackend}
   * interface — never the concrete web/native type.
   */
  private backend: PlaybackBackend | null = null

  private destroyed = false
  private pendingPlay = false
  /** Terminal flag for the no-backend (kind-unresolved) finish() path. */
  private idleFinished = false
  private readonly capability: CapabilityResolver

  constructor(
    config: SpatializedMotionConfig,
    kindOrOptions?: SpatializedMotionKind | SpatializedMotionControllerOptions,
    options: SpatializedMotionControllerOptions = {},
  ) {
    validateSpatializedMotionConfig(config)
    const kind = typeof kindOrOptions === 'string' ? kindOrOptions : undefined
    const resolvedOptions =
      typeof kindOrOptions === 'string' ? options : (kindOrOptions ?? {})

    this.kind = kind ?? null
    this.config = config
    this.id = nextMotionObjectId(
      MOTION_KIND_POLICIES[this.kind ?? 'spatialized2d'].motionObjectIdPrefix,
    )
    this.element = resolvedOptions.element ?? null
    this.capability = resolverFromOptions(resolvedOptions)
    this.onValuesChange = resolvedOptions.onValuesChange
    this.onStateChange = resolvedOptions.onStateChange

    this.sampler = new Sampler(() => this.config)
    this.ensureBackend()

    this.emitValues(evaluateMotionTimeline(config, 0))
  }

  /**
   * Lazily create the single backend once (and only once) the kind is known.
   * spatialized2d may run on either web or native depending on
   * {@link nativeCapable}; the 3d kinds are native-only. Choosing here means the
   * controller holds exactly one strategy for its whole lifetime.
   */
  private ensureBackend(): void {
    if (this.backend || !this.kind) return
    this.backend = this.useNativeBackend
      ? new NativePlaybackBackend(
          {
            getConfig: () => this.config,
            getKind: () => this.kind,
            getElement: () => this.element,
            isNativeCapable: () => this.nativeCapable,
            isDestroyed: () => this.destroyed,
            emitValues: values => this.emitValues(values),
            notifyStateChange: () => this.bump(),
            clearPendingPlay: () => {
              this.pendingPlay = false
            },
          },
          this.sampler,
        )
      : new WebPlaybackBackend(
          {
            getConfig: () => this.config,
            emitValues: values => this.emitValues(values),
            notifyStateChange: () => this.bump(),
            isDestroyed: () => this.destroyed,
            isPendingPlay: () => this.pendingPlay,
            clearPendingPlay: () => {
              this.pendingPlay = false
            },
          },
          this.sampler,
        )
  }

  /**
   * Backend selection (mutually exclusive): native-only kinds (static3d /
   * dynamic3d) always run on the native session; spatialized2d runs on native
   * when the runtime supports it, otherwise on the raf web backend.
   */
  private get useNativeBackend(): boolean {
    return this.nativeCapable || this.policy.webPlayback !== 'raf'
  }

  get isDestroyed(): boolean {
    return this.destroyed
  }

  get definition(): SpatializedMotionConfig {
    return this.config
  }

  get targetKind(): SpatializedMotionKind | null {
    return this.kind
  }

  updateDefinition(config: SpatializedMotionConfig): void {
    validateSpatializedMotionConfig(config)
    this.config = config
  }

  attachElement(
    element: MotionHost | null,
    targetKind?: SpatializedMotionKind,
  ): void {
    const previousKind = this.kind
    const previousElement = this.element

    if (targetKind) {
      if (this.kind && this.kind !== targetKind) {
        console.warn(
          `[${CONTROLLER_LABEL}] motion binding already resolved to ${this.kind}; ignoring ${targetKind}.`,
        )
        return
      }
      if (!this.kind) {
        this.kind = targetKind
      }
    }

    if (element && this.element && this.element !== element) {
      console.warn(
        `[${CONTROLLER_LABEL}] motion binding already attached to another component; ignoring subsequent bind.`,
      )
      return
    }

    this.element = element
    // Kind may have just resolved — create the single backend now (no-op if it
    // already exists). A pending play() is replayed by the autoStart/pending
    // branch below, which now routes through the freshly created backend.
    this.ensureBackend()

    if (previousKind !== this.kind || previousElement !== this.element) {
      this.bump()
    }
    if (!element) return

    if (this.pendingPlay || this.config.autoStart !== false) {
      this.play()
    }
  }

  destroy(): void {
    this.destroyed = true
    this.pendingPlay = false
    this.backend?.destroy()
  }

  get playState(): SpatializedMotionPlayState {
    if (!this.backend) {
      if (this.pendingPlay) return 'queued'
      return this.idleFinished ? 'finished' : 'idle'
    }
    return this.backend.playState
  }

  get isAnimating(): boolean {
    if (!this.backend) return this.pendingPlay
    return this.backend.isAnimating
  }

  get isPaused(): boolean {
    return this.backend?.isPaused ?? false
  }

  get finished(): boolean {
    if (!this.backend) return this.idleFinished
    return this.backend.finished
  }

  /** Fields to suppress on the Portal while the backend drives playback. */
  getSuppressedFields(): Set<string> | null {
    return this.backend?.getSuppressedFields() ?? null
  }

  play(): void {
    if (this.destroyed) return
    if (!this.backend) {
      // Kind not resolved yet: remember the intent and replay it in
      // ensureBackend() once a backend exists.
      this.idleFinished = false
      this.pendingPlay = true
      return
    }
    this.pendingPlay = false
    this.backend.play()
  }

  pause(keys?: SpatializedMotionPropertyKeys): void {
    this.backend?.pause(keys)
  }

  resume(keys?: SpatializedMotionPropertyKeys): void {
    this.backend?.resume(keys)
  }

  stop(): void {
    if (this.destroyed) return
    if (!this.backend) {
      this.pendingPlay = false
      this.idleFinished = false
      return
    }
    this.backend.stop()
  }

  reset(): void {
    if (this.destroyed) return
    if (!this.backend) {
      // Kind not resolved yet: seek to start directly (spec: reset always
      // seeks start, even when idle/unbound).
      this.pendingPlay = false
      this.idleFinished = false
      const values = evaluateMotionTimeline(this.config, 0)
      this.emitValues(values)
      this.bump()
      this.config.onReset?.(values)
      return
    }
    this.backend.reset()
  }

  finish(): void {
    if (this.destroyed) return
    if (!this.backend) {
      // Kind not resolved yet: seek to end directly (spec: finish always seeks
      // end, even when idle/unbound).
      this.pendingPlay = false
      this.idleFinished = true
      const values = evaluateMotionTimeline(this.config, this.config.duration)
      this.emitValues(values)
      this.bump()
      this.config.onComplete?.(values)
      return
    }
    this.backend.finish()
  }

  /** Policy for the current kind (defaults to spatialized2d when unbound). */
  private get policy(): MotionKindPolicy {
    return MOTION_KIND_POLICIES[this.kind ?? 'spatialized2d']
  }

  private get nativeCapable(): boolean {
    if (!this.kind) return false
    return this.capability.supports(this.kind)
  }

  private bump(): void {
    this.onStateChange?.()
  }

  private emitValues(values: SpatializedVisualValues): void {
    this.onValuesChange?.(values)
  }

  /** Called when React Portal unbinds motion wiring. */
  handleMotionUnbind(): void {
    this.backend?.destroy()
    this.element = null
  }

  get nativeSessionAnimating(): boolean {
    return this.backend?.sessionAnimating ?? false
  }
}
