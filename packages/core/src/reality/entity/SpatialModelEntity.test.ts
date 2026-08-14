import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpatialModelEntity } from './SpatialModelEntity'
import { SpatialWebMsgType } from '../../WebMsgCommand'
import type { ModelAnimationClipData } from '../../types/types'

// Record every ControlModelEntityAnimation command the controller sends.
const { commandLog } = vi.hoisted(() => ({
  commandLog: [] as Array<Record<string, any>>,
}))

vi.mock('../../JSBCommand', () => {
  class OkCommand {
    execute() {
      return Promise.resolve({
        success: true,
        data: undefined,
        errorCode: '',
        errorMessage: '',
      })
    }
  }

  class ControlModelEntityAnimationCommand extends OkCommand {
    constructor(
      private entity: { id: string },
      private params: Record<string, any>,
    ) {
      super()
    }
    execute() {
      commandLog.push({ entityId: this.entity.id, ...this.params })
      return super.execute()
    }
  }

  return {
    ControlModelEntityAnimationCommand,
    SetMaterialsOnEntityCommand: OkCommand,
    AnimateTransformJSBCommand: OkCommand,
    AddComponentToEntityCommand: OkCommand,
    RemoveComponentFromEntityCommand: OkCommand,
    UpdateEntityEventCommand: OkCommand,
    UpdateEntityPropertiesCommand: OkCommand,
    SetParentForEntityCommand: OkCommand,
    ConvertFromEntityToEntityCommand: OkCommand,
    ConvertFromEntityToSceneCommand: OkCommand,
    ConvertFromSceneToEntityCommand: OkCommand,
  }
})

const CLIPS: ModelAnimationClipData[] = [
  { id: 'clip_0', name: 'Walk', duration: 2 },
  { id: 'clip_1', name: null, duration: 4 },
]

function makeEntity(clips: ModelAnimationClipData[] = CLIPS) {
  return new SpatialModelEntity('ent-1', {
    modelAssetId: 'asset-1',
    clips,
  })
}

function receiveState(entity: SpatialModelEntity, detail: Record<string, any>) {
  ;(entity as any).onReceiveEvent({
    type: SpatialWebMsgType.animationstatechange,
    detail,
  })
}

describe('SpatialModelEntity animation controller', () => {
  beforeEach(() => {
    commandLog.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('exposes the clip catalog and a controller facade', () => {
    const ent = makeEntity()
    expect(ent.animations).toEqual(CLIPS)
    expect(ent.modelAnimation).toBe(ent)
    expect(ent.currentClip).toBeNull()
    expect(ent.paused).toBe(true)
    expect(ent.duration).toBe(0)
    expect(ent.currentTime).toBe(0)
    expect(ent.playbackRate).toBe(1)
  })

  it('play() with a string id resolves the clip and sends a play command', async () => {
    const ent = makeEntity()
    await ent.play('clip_1', { loop: true, playbackRate: 2 })

    expect(ent.currentClip).toEqual(CLIPS[1])
    expect(ent.paused).toBe(false)
    expect(ent.duration).toBe(4)
    expect(ent.playbackRate).toBe(2)
    expect(commandLog).toEqual([
      {
        entityId: 'ent-1',
        type: 'play',
        clipId: 'clip_1',
        playbackRate: 2,
        loop: true,
      },
    ])
  })

  it('play() with a clip object resolves by id', async () => {
    const ent = makeEntity()
    await ent.play(CLIPS[0])
    expect(ent.currentClip).toEqual(CLIPS[0])
    expect(commandLog[0].clipId).toBe('clip_0')
  })

  it('play() with no argument defaults to the first clip', async () => {
    const ent = makeEntity()
    await ent.play()
    expect(ent.currentClip).toEqual(CLIPS[0])
    expect(commandLog[0].clipId).toBe('clip_0')
  })

  it('play() with an unknown clip id rejects without sending a command', async () => {
    const ent = makeEntity()
    await expect(ent.play('missing')).rejects.toThrow(
      'Animation clip not found: missing',
    )
    expect(commandLog).toHaveLength(0)
  })

  it('play() on an asset without animations is a safe no-op', async () => {
    const ent = makeEntity([])
    await expect(ent.play()).resolves.toBeUndefined()
    expect(ent.currentClip).toBeNull()
    expect(commandLog).toHaveLength(0)
  })

  it('extrapolates currentTime between native samples using playbackRate', async () => {
    const ent = makeEntity()
    await ent.play('clip_0', { playbackRate: 2 })

    vi.advanceTimersByTime(500)
    expect(ent.currentTime).toBeCloseTo(1) // 0.5s elapsed × rate 2
  })

  it('clamps extrapolated currentTime to duration when not looping', async () => {
    const ent = makeEntity()
    await ent.play('clip_0') // duration 2, rate 1

    vi.advanceTimersByTime(10_000)
    expect(ent.currentTime).toBe(2)
  })

  it('wraps extrapolated currentTime modulo duration when looping', async () => {
    const ent = makeEntity()
    await ent.play('clip_0', { loop: true }) // duration 2

    vi.advanceTimersByTime(5_000)
    expect(ent.currentTime).toBeCloseTo(1) // 5s % 2s
  })

  it('pause() freezes currentTime and sends a pause command', async () => {
    const ent = makeEntity()
    await ent.play('clip_0')
    vi.advanceTimersByTime(1_000)

    await ent.pause()
    expect(ent.paused).toBe(true)
    expect(ent.currentTime).toBeCloseTo(1)
    vi.advanceTimersByTime(1_000)
    expect(ent.currentTime).toBeCloseTo(1) // frozen while paused
    expect(commandLog.at(-1)).toEqual({ entityId: 'ent-1', type: 'pause' })
  })

  it('pause() when already paused sends nothing', async () => {
    const ent = makeEntity()
    await ent.pause()
    expect(commandLog).toHaveLength(0)
  })

  it('play() after pause resumes the same clip from its frozen position', async () => {
    const ent = makeEntity()
    await ent.play('clip_0')
    vi.advanceTimersByTime(1_000)
    await ent.pause()

    await ent.play()
    expect(ent.paused).toBe(false)
    expect(ent.currentTime).toBeCloseTo(1) // resumed, not restarted
    expect(commandLog.at(-1)).toMatchObject({ type: 'play', clipId: 'clip_0' })
  })

  it('play() with a different clip restarts optimistic time at 0', async () => {
    const ent = makeEntity()
    await ent.play('clip_0')
    vi.advanceTimersByTime(1_000)

    await ent.play('clip_1')
    expect(ent.currentClip).toEqual(CLIPS[1])
    expect(ent.currentTime).toBe(0)
  })

  it('play() again after a non-looping clip completed restarts at 0', async () => {
    const ent = makeEntity()
    await ent.play('clip_0') // duration 2
    vi.advanceTimersByTime(10_000) // run past the end
    await ent.pause()

    await ent.play('clip_0')
    expect(ent.currentTime).toBe(0)
  })

  it('seek() clamps to [0, duration] and sends the clamped time', async () => {
    const ent = makeEntity()
    await ent.play('clip_0') // duration 2

    ent.seek(10)
    expect(ent.currentTime).toBeLessThanOrEqual(2)
    expect(commandLog.at(-1)).toEqual({
      entityId: 'ent-1',
      type: 'seek',
      time: 2,
    })

    ent.seek(-5)
    expect(commandLog.at(-1)).toEqual({
      entityId: 'ent-1',
      type: 'seek',
      time: 0,
    })
  })

  it('setPlaybackRate() re-anchors so the new rate only applies forward', async () => {
    const ent = makeEntity()
    await ent.play('clip_0', { loop: true })
    vi.advanceTimersByTime(1_000) // 1s at rate 1

    ent.setPlaybackRate(0.5)
    vi.advanceTimersByTime(1_000) // 1s at rate 0.5
    expect(ent.currentTime).toBeCloseTo(1.5)
    expect(ent.playbackRate).toBe(0.5)
    expect(commandLog.at(-1)).toEqual({
      entityId: 'ent-1',
      type: 'setPlaybackRate',
      rate: 0.5,
    })
  })

  it('syncs state from native animationstatechange samples', async () => {
    const ent = makeEntity()
    await ent.play('clip_0')

    receiveState(ent, {
      paused: false,
      duration: 2.5,
      currentTime: 1.25,
      timestamp: Date.now(),
      clipId: 'clip_0',
    })
    expect(ent.duration).toBe(2.5)
    expect(ent.currentTime).toBeCloseTo(1.25)
    expect(ent.paused).toBe(false)
  })

  it('a final native sample with paused=true ends extrapolation', async () => {
    const ent = makeEntity()
    await ent.play('clip_0')

    receiveState(ent, {
      paused: true,
      duration: 2,
      currentTime: 2,
      timestamp: Date.now(),
      clipId: 'clip_0',
    })
    expect(ent.paused).toBe(true)
    vi.advanceTimersByTime(1_000)
    expect(ent.currentTime).toBe(2)
  })

  it('adopts a native-reported clip change via clipId', async () => {
    const ent = makeEntity()
    await ent.play('clip_0')

    receiveState(ent, {
      paused: false,
      duration: 4,
      currentTime: 0.5,
      timestamp: Date.now(),
      clipId: 'clip_1',
    })
    expect(ent.currentClip).toEqual(CLIPS[1])
  })

  it('independent instances sharing one clip catalog do not affect each other', async () => {
    const a = new SpatialModelEntity('ent-a', {
      modelAssetId: 'asset-1',
      clips: CLIPS,
    })
    const b = new SpatialModelEntity('ent-b', {
      modelAssetId: 'asset-1',
      clips: CLIPS,
    })

    await a.play('clip_0')
    await b.play('clip_1')
    await a.pause()

    expect(a.paused).toBe(true)
    expect(b.paused).toBe(false)
    expect(commandLog.map(c => c.entityId)).toEqual(['ent-a', 'ent-b', 'ent-a'])
  })

  it('bindAssetClips() seeds a late-arriving catalog', async () => {
    const ent = new SpatialModelEntity('ent-late', {
      modelAssetId: 'asset-1',
    })
    await ent.play() // no clips yet — no-op
    expect(commandLog).toHaveLength(0)

    ent.bindAssetClips(CLIPS)
    await ent.play('clip_1')
    expect(ent.currentClip).toEqual(CLIPS[1])
  })
})
