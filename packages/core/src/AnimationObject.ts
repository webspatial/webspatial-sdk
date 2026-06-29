import {
  ControlSpatializedElementAnimationJSBCommand,
  CreateSpatializedElementAnimationJSBCommand,
} from './JSBCommand'
import { SpatialObject } from './SpatialObject'
import { SpatialWebEvent } from './SpatialWebEvent'
import type {
  ControlSpatializedElementAnimationCommand,
  SpatialAnimationStateChangedDetail,
  SpatialAnimationStateChangedMsg,
} from './types/motion/spatializedElementMotion'
import type { SpatializedPlaybackError } from './types/motion/spatializedPlayback'
import type { SpatializedVisualValues } from './types/motion/spatializedVisual'
import type {
  SpatializedMotionTimeline,
  SpatializedPlaybackApi,
} from './types/motion/spatializedMotion'

export interface AnimationObjectCreateOptions {
  elementId: string
  timeline: SpatializedMotionTimeline
}

export interface AnimationObjectCallbacks {
  onStart?: () => void
  onComplete?: (values: SpatializedVisualValues) => void
  onStop?: (values: SpatializedVisualValues) => void
  onReset?: (values: SpatializedVisualValues) => void
  onError?: (error: SpatializedPlaybackError) => void
  onValuesChange?: (values: SpatializedVisualValues) => void
  onStateChange?: () => void
}

export class AnimationObject
  extends SpatialObject
  implements SpatializedPlaybackApi
{
  readonly elementId: string
  readonly timeline: SpatializedMotionTimeline

  private callbacks: AnimationObjectCallbacks = {}
  private _playState: 'idle' | 'queued' | 'running' | 'paused' | 'finished' =
    'idle'
  private _finished = false
  private started = false

  constructor(id: string, options: AnimationObjectCreateOptions) {
    super(id)
    this.elementId = options.elementId
    this.timeline = options.timeline

    SpatialWebEvent.addEventReceiver(id, data => this.onReceiveEvent(data))
  }

  static async create(options: AnimationObjectCreateOptions) {
    const ret = await new CreateSpatializedElementAnimationJSBCommand({
      elementId: options.elementId,
      timeline: options.timeline,
    }).execute()
    if (!ret.success) {
      throw new Error(
        ret.errorMessage ?? 'CreateSpatializedElementAnimation command failed',
      )
    }

    const data = ret.data as { id?: string } | undefined
    const id = data?.id
    if (!id) {
      throw new Error('CreateSpatializedElementAnimation did not return an id')
    }

    return new AnimationObject(id, options)
  }

  get uuid(): string {
    return this.id
  }

  setCallbacks(callbacks: AnimationObjectCallbacks): void {
    this.callbacks = callbacks
  }

  get playState() {
    return this._playState
  }

  get isAnimating() {
    return this._playState === 'running' || this._playState === 'queued'
  }

  get isPaused() {
    return this._playState === 'paused'
  }

  get finished() {
    return this._finished
  }

  async play(): Promise<void> {
    if (this.isDestroyed) return
    await this.control('play')
  }

  async pause(): Promise<void> {
    await this.control('pause')
  }

  async resume(): Promise<void> {
    await this.control('resume')
  }

  async stop(): Promise<void> {
    this.started = false
    await this.control('stop')
  }

  async reset(): Promise<void> {
    this.started = false
    await this.control('reset')
  }

  async finish(): Promise<void> {
    this.started = false
    await this.control('finish')
  }

  protected override onDestroy(): void {
    SpatialWebEvent.removeEventReceiver(this.id)
  }

  private async control(
    type: ControlSpatializedElementAnimationCommand['type'],
  ): Promise<void> {
    if (this.isDestroyed) return

    const ret = await new ControlSpatializedElementAnimationJSBCommand({
      animationId: this.id,
      type,
    }).execute()

    if (!ret.success) {
      const error = {
        animationId: this.id,
        command: type === 'destroy' ? 'stop' : type,
        reason:
          ret.errorMessage ??
          `ControlSpatializedElementAnimation(${type}) command failed`,
      } as SpatializedPlaybackError
      this.callbacks.onError?.(error)
      throw new Error(error.reason)
    }
  }

  onReceiveEvent(data: SpatialAnimationStateChangedMsg | { detail?: unknown }) {
    const detail = data?.detail ?? data
    if (!this.isSpatialAnimationStateChangedDetail(detail)) return
    if (detail.animationId !== this.id) return

    this._playState = detail.playState
    this._finished = detail.finished

    if (detail.values) {
      this.callbacks.onValuesChange?.(detail.values)
    }
    if (detail.action !== 'start') {
      this.callbacks.onStateChange?.()
    }

    if (detail.error) {
      this.started = false
      this.callbacks.onError?.(detail.error)
      return
    }

    if (detail.action === 'start') {
      if (!this.started) {
        this.started = true
        this.callbacks.onStart?.()
      }
      return
    }

    if (
      detail.action === 'complete' ||
      detail.action === 'completed' ||
      detail.action === 'finish'
    ) {
      this.started = false
      this.callbacks.onComplete?.(detail.values ?? {})
      return
    }

    if (detail.action === 'stop') {
      this.started = false
      this.callbacks.onStop?.(detail.values ?? {})
      return
    }

    if (detail.action === 'reset') {
      this.started = false
      this.callbacks.onReset?.(detail.values ?? {})
      return
    }

    if (detail.action === 'destroy') {
      this.started = false
      this.isDestroyed = true
      this.onDestroy()
    }
  }

  private isSpatialAnimationStateChangedDetail(
    detail: unknown,
  ): detail is SpatialAnimationStateChangedDetail {
    if (!detail || typeof detail !== 'object') return false
    const candidate = detail as Partial<SpatialAnimationStateChangedDetail>
    return (
      typeof candidate.animationId === 'string' &&
      typeof candidate.action === 'string' &&
      typeof candidate.playState === 'string' &&
      typeof candidate.finished === 'boolean'
    )
  }
}
