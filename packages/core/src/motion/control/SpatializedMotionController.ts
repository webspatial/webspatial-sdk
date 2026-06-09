import { supports } from '../../runtime/supports'
import type { Spatialized2DElement } from '../../Spatialized2DElement'
import type { SpatializedStatic3DElement } from '../../SpatializedStatic3DElement'
import type { SpatializedDynamic3DElement } from '../../SpatializedDynamic3DElement'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'
import type { SpatializedMotionHandle } from './SpatializedMotionHandle'
import { MOTION_KIND_POLICIES, type MotionKindPolicy } from './motionKindPolicy'
import { WebPlaybackBackend } from './WebPlaybackBackend'
import { NativePlaybackBackend } from './NativePlaybackBackend'
import { Sampler } from './Sampler'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type {
  SpatializedMotionConfig,
  SpatializedPlaybackApi,
  SpatializedMotionPlayState,
  SpatializedMotionPropertyKeys,
} from '../../types/spatializedMotion'
import { evaluateMotionTimeline } from '../compute/sample'
import { validateSpatializedMotionConfig } from '../compute/validate'

/**
 * Host elements that can drive native spatialized motion via {@link Element.animateMotion}.
 */
export type MotionHostElement =
  | Spatialized2DElement
  | SpatializedStatic3DElement
  | SpatializedDynamic3DElement

export interface SpatializedMotionControllerOptions {
  /** Initial element; may be set later via {@link attachElement}. */
  element?: MotionHostElement | null
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

function getPolicy(kind: SpatializedMotionKind | null): MotionKindPolicy {
  switch (kind) {
    case 'static3d':
      return MOTION_KIND_POLICIES.static3d
    case 'dynamic3d':
      return MOTION_KIND_POLICIES.dynamic3d
    case 'spatialized2d':
    default:
      return MOTION_KIND_POLICIES.spatialized2d
  }
}

const CONTROLLER_LABEL = 'SpatializedMotionController'

/**
 * Runtime controller for a spatialized element motion timeline.
 *
 * Facade over two interchangeable playback strategies (Strategy pattern): the
 * raf-driven {@link WebPlaybackBackend} and the native-session
 * {@link NativePlaybackBackend}. Both implement the common
 * {@link PlaybackBackend} abstraction and share a single {@link Sampler}, so
 * neither depends on the other. The controller selects a backend at runtime via
 * {@link nativeCapable}, delegates the six playback verbs and aggregates state
 * for the public API.
 */
export class SpatializedMotionController
  implements SpatializedPlaybackApi, SpatializedMotionHandle
{
  readonly id: string

  private kind: SpatializedMotionKind | null
  private config: SpatializedMotionConfig
  private element: MotionHostElement | null
  private readonly onValuesChange?: (values: SpatializedVisualValues) => void
  private readonly onStateChange?: () => void

  /** Shared visual sampler / freeze registry (used by both backends). */
  private readonly sampler: Sampler
  /** raf-driven web playback strategy. */
  private readonly web: WebPlaybackBackend
  /** native-session playback strategy. */
  private readonly native: NativePlaybackBackend

  private warnedNativeOnly = false
  private destroyed = false
  private pendingPlay = false
  private readonly forceNativePlayback?: boolean
  private readonly supportsMotionKind?: (kind: SpatializedMotionKind) => boolean

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
      this.kind === 'static3d'
        ? MOTION_KIND_POLICIES.static3d.motionObjectIdPrefix
        : this.kind === 'dynamic3d'
          ? MOTION_KIND_POLICIES.dynamic3d.motionObjectIdPrefix
          : MOTION_KIND_POLICIES.spatialized2d.motionObjectIdPrefix,
    )
    this.element = resolvedOptions.element ?? null
    this.forceNativePlayback = resolvedOptions.forceNativePlayback
    this.supportsMotionKind = resolvedOptions.supportsMotionKind
    this.onValuesChange = resolvedOptions.onValuesChange
    this.onStateChange = resolvedOptions.onStateChange

    this.sampler = new Sampler(() => this.config)
    this.web = new WebPlaybackBackend(
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
    this.native = new NativePlaybackBackend(
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
        stopWeb: () => this.web.stopRaf(),
        jsReset: () => this.web.reset(),
        jsFinish: () => this.web.finish(),
      },
      this.sampler,
    )

    this.emitValues(evaluateMotionTimeline(config, 0))
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
    element: MotionHostElement | null,
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
    this.web.stopRaf()
    this.native.detach({ cancelSession: true })
  }

  get playState(): SpatializedMotionPlayState {
    if (!this.kind) {
      if (this.pendingPlay) return 'queued'
      return this.web.state
    }

    const s = this.native.sessionState
    if (s === 'queued') return 'running'
    if (s && s !== 'idle') return s
    return this.web.state
  }

  get isAnimating(): boolean {
    if (!this.kind) {
      return this.pendingPlay || this.web.state === 'running'
    }
    const s = this.native.sessionState
    if (s === 'running' || s === 'queued') return true
    return this.web.state === 'running' || this.web.state === 'queued'
  }

  get isPaused(): boolean {
    if (this.kind && this.native.sessionState === 'paused') {
      return true
    }
    return (
      this.web.state === 'paused' ||
      (this.web.state === 'running' && this.sampler.hasFrozen)
    )
  }

  get finished(): boolean {
    if (this.kind && this.native.sessionState === 'finished') {
      return true
    }
    return this.web.finished
  }

  /** Fields to suppress on the Portal while native drives playback. */
  getSuppressedFields(): Set<string> | null {
    if (!this.kind) return null
    if (this.kind === 'spatialized2d') {
      const nativeState = this.native.sessionState
      const nativeSuppressionReleased =
        this.nativeCapable &&
        !this.pendingPlay &&
        !this.native.controlling &&
        (!nativeState || nativeState === 'idle' || nativeState === 'finished')

      if (nativeSuppressionReleased) {
        return null
      }
      if (nativeState !== 'running' && nativeState !== 'paused') {
        return null
      }
      const active = this.sampler.getActiveProperties()
      const subset = this.config.tracks.filter(t => active.includes(t.property))
      if (subset.length === 0) return null
      return getPolicy(this.kind).getSuppressedFields({
        ...this.config,
        tracks: subset,
      })
    }
    const s = this.native.sessionState
    if (!s || (s !== 'running' && s !== 'paused')) return null
    const active = this.sampler.getActiveProperties()
    const subset = this.config.tracks.filter(t => active.includes(t.property))
    if (subset.length === 0) return null
    return getPolicy(this.kind).getSuppressedFields({
      ...this.config,
      tracks: subset,
    })
  }

  play(): void {
    if (this.destroyed) return
    if (!this.kind) {
      if (!this.pendingPlay) {
        this.pendingPlay = true
        this.web.markQueued(true)
      }
      return
    }

    this.pendingPlay = false

    const policy = getPolicy(this.kind)
    if (!this.nativeCapable) {
      if (policy.webPlayback === 'none') {
        if (!this.warnedNativeOnly) {
          this.warnedNativeOnly = true
          console.warn(
            `[${CONTROLLER_LABEL}] Declarative motion requires native runtime (supports('useAnimation', ['${this.kind}'])). Web playback is not supported for this element kind.`,
          )
        }
        this.web.markQueued()
        return
      }
      this.web.play()
      return
    }

    this.native.play()
  }

  pause(keys?: SpatializedMotionPropertyKeys): void {
    if (!this.kind) return
    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') this.web.pause(keys)
      return
    }
    this.native.pause(keys)
  }

  resume(keys?: SpatializedMotionPropertyKeys): void {
    if (!this.kind) return
    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') this.web.resume(keys)
      return
    }
    this.native.resume(keys)
  }

  stop(): void {
    if (this.destroyed) return
    if (!this.kind) {
      this.web.stop()
      return
    }

    if (!this.nativeCapable) {
      if (getPolicy(this.kind).webPlayback === 'raf') {
        this.web.stop()
        return
      }
      if (this.web.state === 'queued' || this.pendingPlay) {
        this.web.stop()
      }
      return
    }

    this.native.stop()
  }

  reset(): void {
    if (this.destroyed) return
    if (!this.kind) {
      this.web.reset()
      return
    }

    if (!this.nativeCapable) {
      this.web.reset()
      return
    }

    this.native.reset()
  }

  finish(): void {
    if (this.destroyed) return
    if (!this.kind) {
      this.web.finish()
      return
    }

    if (!this.nativeCapable) {
      this.web.finish()
      return
    }

    this.native.finish()
  }

  private get nativeCapable(): boolean {
    if (!this.kind) return false
    if (this.forceNativePlayback !== undefined) {
      return this.forceNativePlayback
    }
    if (this.supportsMotionKind) {
      return this.supportsMotionKind(this.kind)
    }
    const token = this.kind === 'spatialized2d' ? 'element' : this.kind
    return supports('useAnimation', [token])
  }

  private bump(): void {
    this.onStateChange?.()
  }

  private emitValues(values: SpatializedVisualValues): void {
    this.onValuesChange?.(values)
  }

  /** Called when React Portal unbinds motion wiring. */
  handleMotionUnbind(): void {
    this.native.detach({ cancelSession: true })
    this.element = null
  }

  get nativeSessionAnimating(): boolean {
    return this.native.sessionAnimating
  }
}
