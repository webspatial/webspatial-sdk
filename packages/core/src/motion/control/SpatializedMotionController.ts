import type {
  SpatializedMotionConfig,
  SpatializedMotionKind,
  SpatializedMotionPlayState,
  SpatializedPlaybackApi,
} from '../../types/spatializedMotion'
import { MOTION_KIND_POLICIES, type MotionKindPolicy } from './motionKindPolicy'
import type { MotionHost } from './MotionHost'
import {
  createCapabilityResolverFromOptions,
  type CapabilityResolver,
} from './CapabilityResolver'
import { WebPlaybackBackend } from './WebPlaybackBackend'
import { NativePlaybackBackend } from './NativePlaybackBackend'
import type { PlaybackBackend } from './PlaybackBackend'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import { evaluateMotionTimeline } from '../compute/sample'
import { validateSpatializedMotionConfig } from '../compute/validate'

/**
 * Construction options for the motion controller runtime wrapper.
 */
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
/**
 * Allocates stable ids for motion objects created in JS.
 *
 * @param prefix Motion-object prefix for the current policy.
 * @returns A unique controller id.
 */
function nextMotionObjectId(prefix: string): string {
  return `${prefix}${++_motionObjectCounter}_${Date.now()}`
}

const CONTROLLER_LABEL = 'SpatializedMotionController'

/**
 * Runtime controller for a spatialized element motion timeline.
 *
 * Chooses a single playback backend once the motion `kind` is known. Until
 * then, the controller keeps only the minimal pending state needed to support
 * play, reset, and finish before binding resolves.
 */
export class SpatializedMotionController implements SpatializedPlaybackApi {
  readonly id: string

  private kind: SpatializedMotionKind | null
  private _config: SpatializedMotionConfig
  private element: MotionHost | null
  private readonly onValuesChange?: (values: SpatializedVisualValues) => void
  private readonly onStateChange?: () => void

  /**
   * The single chosen playback strategy, or `null` until the motion `kind`
   * resolves.
   */
  private backend: PlaybackBackend | null = null

  private destroyed = false
  private pendingPlay = false
  /** Terminal flag for the no-backend (kind-unresolved) finish() path. */
  private idleFinished = false
  /** Session snapshot retained while target kind is still unresolved. */
  private unboundSessionConfig: SpatializedMotionConfig | null = null
  private readonly capabilityResolver: CapabilityResolver

  constructor(
    config: SpatializedMotionConfig,
    options: SpatializedMotionControllerOptions = {},
  ) {
    validateSpatializedMotionConfig(config)
    this.kind = null
    this._config = config
    this.id = nextMotionObjectId(
      MOTION_KIND_POLICIES[this.kind ?? 'spatialized2d'].motionObjectIdPrefix,
    )
    this.element = options.element ?? null
    this.capabilityResolver = createCapabilityResolverFromOptions(options)
    this.onValuesChange = options.onValuesChange
    this.onStateChange = options.onStateChange

    this.ensurePlaybackBackend()

    this.emitValues(evaluateMotionTimeline(config, 0))
  }

  /**
   * Lazily create the single backend once (and only once) the kind is known.
   * spatialized2d may run on either web or native depending on
   * {@link isNativePlaybackSupported}; the 3d kinds are native-only.
   */
  private ensurePlaybackBackend(): void {
    if (this.backend || !this.kind) return
    this.backend = this.shouldUseNativeBackend
      ? new NativePlaybackBackend({
          getConfig: () => this._config,
          getKind: () => this.kind,
          getElement: () => this.element,
          isNativeCapable: () => this.isNativePlaybackSupported,
          isDestroyed: () => this.destroyed,
          emitValues: values => this.emitValues(values),
          notifyStateChange: () => this.notifyStateChange(),
          clearPendingPlay: () => {
            this.pendingPlay = false
          },
        })
      : new WebPlaybackBackend({
          getConfig: () => this._config,
          emitValues: values => this.emitValues(values),
          notifyStateChange: () => this.notifyStateChange(),
          isDestroyed: () => this.destroyed,
          isPendingPlay: () => this.pendingPlay,
          clearPendingPlay: () => {
            this.pendingPlay = false
          },
        })
  }

  /**
   * Backend selection (mutually exclusive): native-only kinds (static3d /
   * dynamic3d) always run on the native session; spatialized2d runs on native
   * when the runtime supports it, otherwise on the raf web backend.
   */
  private get shouldUseNativeBackend(): boolean {
    return this.isNativePlaybackSupported || this.policy.webPlayback !== 'raf'
  }

  get isDestroyed(): boolean {
    return this.destroyed
  }

  get config(): SpatializedMotionConfig {
    return this._config
  }

  get targetKind(): SpatializedMotionKind | null {
    return this.kind
  }

  updateConfig(config: SpatializedMotionConfig): void {
    validateSpatializedMotionConfig(config, {
      targetKind: this.kind ?? undefined,
    })
    this._config = config
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
      validateSpatializedMotionConfig(this._config, { targetKind })
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
    this.ensurePlaybackBackend()

    if (previousKind !== this.kind || previousElement !== this.element) {
      this.notifyStateChange()
    }
    if (!element) return

    if (this.pendingPlay || this._config.autoStart !== false) {
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

  private getCurrentUnboundSessionConfig(): SpatializedMotionConfig {
    return this.unboundSessionConfig ?? this._config
  }

  play(): void {
    if (this.destroyed) return
    if (!this.backend) {
      // Kind not resolved yet: remember the intent and replay it in
      // ensurePlaybackBackend() once a backend exists.
      if (!this.pendingPlay || this.idleFinished) {
        this.unboundSessionConfig = this._config
      }
      this.idleFinished = false
      this.pendingPlay = true
      return
    }
    this.pendingPlay = false
    this.backend.play()
  }

  pause(): void {
    this.backend?.pause()
  }

  resume(): void {
    this.backend?.resume()
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
      const cfg = this.getCurrentUnboundSessionConfig()
      this.pendingPlay = false
      this.idleFinished = false
      this.unboundSessionConfig = null
      const values = evaluateMotionTimeline(cfg, 0)
      this.emitValues(values)
      this.notifyStateChange()
      cfg.onReset?.(values)
      return
    }
    this.backend.reset()
  }

  finish(): void {
    if (this.destroyed) return
    if (!this.backend) {
      // Kind not resolved yet: seek to end directly (spec: finish always seeks
      // end, even when idle/unbound).
      const cfg = this.getCurrentUnboundSessionConfig()
      this.pendingPlay = false
      this.idleFinished = true
      this.unboundSessionConfig = cfg
      const values = evaluateMotionTimeline(cfg, cfg.duration)
      this.emitValues(values)
      this.notifyStateChange()
      cfg.onComplete?.(values)
      return
    }
    this.backend.finish()
  }

  /** Policy for the current kind (defaults to spatialized2d when unbound). */
  private get policy(): MotionKindPolicy {
    return MOTION_KIND_POLICIES[this.kind ?? 'spatialized2d']
  }

  private get isNativePlaybackSupported(): boolean {
    if (!this.kind) return false
    return this.capabilityResolver.supports(this.kind)
  }

  private notifyStateChange(): void {
    this.onStateChange?.()
  }

  private emitValues(values: SpatializedVisualValues): void {
    this.onValuesChange?.(values)
  }

  /** Called when React Portal unbinds motion wiring. */
  handleMotionUnbind(): void {
    this.backend?.destroy()
    this.backend = null
    this.element = null
  }
}
