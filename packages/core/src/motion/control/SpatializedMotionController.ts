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
 * Facade over two interchangeable playback strategies (Strategy pattern): the
 * raf-driven {@link WebPlaybackBackend} and the native-session
 * {@link NativePlaybackBackend}. Both implement the common
 * {@link PlaybackBackend} abstraction and share a single {@link Sampler}, so
 * neither depends on the other. The controller selects a backend at runtime via
 * {@link nativeCapable}, delegates the six playback verbs and aggregates state
 * for the public API.
 */
export class SpatializedMotionController implements SpatializedMotionHandle {
  readonly id: string

  private kind: SpatializedMotionKind | null
  private config: SpatializedMotionConfig
  private element: MotionHost | null
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

  /**
   * Single source of truth for the merged playback state. Both backends are
   * read here once; the four public getters derive purely from this snapshot.
   */
  private resolveState(): {
    hasKind: boolean
    pendingPlay: boolean
    web: SpatializedMotionPlayState
    webFinished: boolean
    native: SpatializedMotionPlayState | undefined
    hasFrozen: boolean
  } {
    const hasKind = !!this.kind
    return {
      hasKind,
      pendingPlay: this.pendingPlay,
      web: this.web.state,
      webFinished: this.web.finished,
      native: hasKind ? this.native.sessionState : undefined,
      hasFrozen: this.sampler.hasFrozen,
    }
  }

  get playState(): SpatializedMotionPlayState {
    const { hasKind, pendingPlay, web, native } = this.resolveState()
    if (!hasKind) return pendingPlay ? 'queued' : web
    if (native === 'queued') return 'running'
    if (native && native !== 'idle') return native
    return web
  }

  get isAnimating(): boolean {
    const { hasKind, pendingPlay, web, native } = this.resolveState()
    if (!hasKind) return pendingPlay || web === 'running'
    if (native === 'running' || native === 'queued') return true
    return web === 'running' || web === 'queued'
  }

  get isPaused(): boolean {
    const { hasKind, web, native, hasFrozen } = this.resolveState()
    if (hasKind && native === 'paused') return true
    return web === 'paused' || (web === 'running' && hasFrozen)
  }

  get finished(): boolean {
    const { hasKind, webFinished, native } = this.resolveState()
    if (hasKind && native === 'finished') return true
    return webFinished
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
      return this.policy.getSuppressedFields({
        ...this.config,
        tracks: subset,
      })
    }
    const s = this.native.sessionState
    if (!s || (s !== 'running' && s !== 'paused')) return null
    const active = this.sampler.getActiveProperties()
    const subset = this.config.tracks.filter(t => active.includes(t.property))
    if (subset.length === 0) return null
    return this.policy.getSuppressedFields({
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

    if (!this.nativeCapable) {
      if (!this.webDriven) {
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

    this.web.stopRaf()
    this.native.play()
  }

  pause(keys?: SpatializedMotionPropertyKeys): void {
    if (!this.kind) return
    if (!this.nativeCapable) {
      if (this.webDriven) this.web.pause(keys)
      return
    }
    this.native.pause(keys)
  }

  resume(keys?: SpatializedMotionPropertyKeys): void {
    if (!this.kind) return
    if (!this.nativeCapable) {
      if (this.webDriven) this.web.resume(keys)
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
      if (this.webDriven) {
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

    const ns = this.native.sessionState
    if (ns && ns !== 'idle') {
      this.native.reset()
    } else {
      this.native.bumpToken()
      this.web.reset()
    }
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

    const ns = this.native.sessionState
    if (ns && ns !== 'idle' && ns !== 'finished') {
      this.native.finish()
    } else if (!ns || ns === 'idle') {
      this.native.bumpToken()
      this.web.finish()
    }
  }

  /** Policy for the current kind (defaults to spatialized2d when unbound). */
  private get policy(): MotionKindPolicy {
    return MOTION_KIND_POLICIES[this.kind ?? 'spatialized2d']
  }

  /** Whether the current kind is driven by the raf web backend. */
  private get webDriven(): boolean {
    return this.policy.webPlayback === 'raf'
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
    this.native.detach({ cancelSession: true })
    this.element = null
  }

  get nativeSessionAnimating(): boolean {
    return this.native.sessionAnimating
  }
}
