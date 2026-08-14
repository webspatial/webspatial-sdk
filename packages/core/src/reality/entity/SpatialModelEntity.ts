import {
  SpatialEntityUserData,
  SpatialModelEntityCreationOptions,
  ModelAnimationClipData,
  ModelAnimationController,
  PlayModelAnimationOptions,
} from '../../types/types'
import {
  SetMaterialsOnEntityCommand,
  ControlModelEntityAnimationCommand,
} from '../../JSBCommand'
import { SpatialMaterial } from '../material/SpatialMaterial'
import { SpatialEntity } from './SpatialEntity'
import { AnimationStateChangeDetail } from '../../WebMsgCommand'

export class SpatialModelEntity
  extends SpatialEntity
  implements ModelAnimationController
{
  /** Clip catalog of the source asset (seeded at creation). */
  private _clips: readonly ModelAnimationClipData[] = []

  private _currentClip: ModelAnimationClipData | null = null
  private _paused = true
  private _playbackRate = 1
  private _duration = 0
  private _loop = false

  /**
   * Last playback position sampled from native (seconds), anchored at
   * `_anchorTimestamp` so reads between native samples can extrapolate.
   * Mirrors the pattern used by `SpatializedStatic3DElement`.
   */
  private _currentTime = 0
  private _anchorTimestamp = 0

  constructor(
    public id: string,
    public options?: SpatialModelEntityCreationOptions,
    public userData?: SpatialEntityUserData,
  ) {
    super(id, userData)
    if (options?.clips) {
      this._clips = options.clips
    }
  }

  async setMaterials(materials: SpatialMaterial[]) {
    return new SetMaterialsOnEntityCommand(this.id, materials).execute()
  }

  /**
   * Binds the clip catalog of the source asset so the controller can resolve
   * clip names/ids without an async round-trip. Called by the creation path;
   * safe to call again if the catalog arrives late.
   */
  bindAssetClips(clips: readonly ModelAnimationClipData[]) {
    this._clips = clips
  }

  /** Discovered clips of the source asset. */
  get animations(): readonly ModelAnimationClipData[] {
    return this._clips
  }

  /**
   * Controller facade for built-in model animation playback.
   * `SpatialModelEntity` implements `ModelAnimationController` directly.
   */
  get modelAnimation(): ModelAnimationController {
    return this
  }

  // ---- ModelAnimationController surface ----

  get currentClip(): ModelAnimationClipData | null {
    return this._currentClip
  }

  get duration(): number {
    // Seeded from clip metadata at play() and corrected by native samples.
    return this._currentClip ? this._duration : 0
  }

  get paused(): boolean {
    return this._paused
  }

  get playbackRate(): number {
    return this._playbackRate
  }

  get currentTime(): number {
    if (this._paused || !this._currentClip) return this._currentTime
    const elapsed = (Date.now() - this._anchorTimestamp) / 1000
    return this.clampTime(this._currentTime + elapsed * this._playbackRate)
  }

  private clampTime(time: number): number {
    if (!Number.isFinite(time) || time < 0) return 0
    if (this._duration <= 0) return 0
    if (time > this._duration) {
      return this._loop ? time % this._duration : this._duration
    }
    return time
  }

  /**
   * Plays a clip. With no argument, resumes the current clip (or starts the
   * first discovered clip). Starting a different clip immediately replaces
   * the active one (no crossfade in V1).
   */
  async play(
    clip?: string | ModelAnimationClipData,
    options?: PlayModelAnimationOptions,
  ): Promise<void> {
    let target = this._currentClip
    if (clip !== undefined) {
      const clipId = typeof clip === 'string' ? clip : clip.id
      target = this._clips.find(c => c.id === clipId) ?? null
      if (!target) {
        throw new Error(`Animation clip not found: ${clipId}`)
      }
    }
    if (!target && this._clips.length > 0) {
      // Default to the first clip when none selected yet.
      target = this._clips[0]
    }
    if (!target) {
      // Asset has no animations — play() is a safe no-op.
      return
    }

    const rate = options?.playbackRate ?? this._playbackRate
    const loop = options?.loop ?? this._loop

    // Optimistic local state so reads reflect the request immediately;
    // the next native sample corrects any drift.
    const isNewClip = target !== this._currentClip
    const ended =
      !isNewClip &&
      !this._loop &&
      this._duration > 0 &&
      this.currentTime >= this._duration
    this._currentClip = target
    this._duration = target.duration
    this._playbackRate = rate
    this._loop = loop
    if (isNewClip || ended) {
      // A replaced or completed clip restarts from time 0.
      this._currentTime = 0
    }
    this._paused = false
    this._anchorTimestamp = Date.now()

    const result = await new ControlModelEntityAnimationCommand(this, {
      type: 'play',
      clipId: target.id,
      playbackRate: rate,
      loop,
    }).execute()
    if (!result.success) {
      throw new Error(
        result.errorMessage ?? 'ControlModelEntityAnimation play failed',
      )
    }
  }

  async pause(): Promise<void> {
    if (this._paused) return
    // Freeze the extrapolated position so reads remain stable until the
    // next native sample arrives.
    this._currentTime = this.currentTime
    this._anchorTimestamp = Date.now()
    this._paused = true
    await new ControlModelEntityAnimationCommand(this, {
      type: 'pause',
    }).execute()
  }

  seek(time: number): void {
    const clamped = Math.max(
      0,
      Math.min(Number.isFinite(time) ? time : 0, this.duration),
    )
    this._currentTime = clamped
    this._anchorTimestamp = Date.now()
    void new ControlModelEntityAnimationCommand(this, {
      type: 'seek',
      time: clamped,
    }).execute()
  }

  setPlaybackRate(rate: number): void {
    if (!this._paused) {
      // Re-anchor so extrapolation applies the new rate only to future
      // elapsed time, not the window since the last sample.
      this._currentTime = this.currentTime
      this._anchorTimestamp = Date.now()
    }
    this._playbackRate = rate
    void new ControlModelEntityAnimationCommand(this, {
      type: 'setPlaybackRate',
      rate,
    }).execute()
  }

  // ---- Native event intake ----

  protected override onReceiveAnimationState(
    detail: AnimationStateChangeDetail,
  ): void {
    this._paused = detail.paused
    this._duration = detail.duration || this._duration
    this._currentTime = detail.currentTime ?? this._currentTime
    this._anchorTimestamp = detail.timestamp ?? Date.now()
    // Defensive: native may echo the clip it is playing (e.g. after a
    // native-driven change). Keep the catalog reference in sync.
    if (detail.clipId && detail.clipId !== this._currentClip?.id) {
      this._currentClip =
        this._clips.find(c => c.id === detail.clipId) ?? this._currentClip
    }
  }
}
