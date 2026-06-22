import { describe, expect, it, vi } from 'vitest'
import { AttachmentRegistry } from './AttachmentContext'

describe('AttachmentRegistry', () => {
  it('keys containers and listeners by asset id', () => {
    const registry = new AttachmentRegistry()
    const el = document.createElement('div')
    const listener = vi.fn()

    registry.onContainersChange('hud-asset', listener)

    registry.addContainer('hud-asset', 'placement-a', el)
    expect(listener).toHaveBeenLastCalledWith([
      { instanceId: 'placement-a', container: el },
    ])

    registry.removeContainer('hud-asset', 'placement-a')
    expect(listener).toHaveBeenLastCalledWith([])
  })

  it('isolates different asset ids', () => {
    const registry = new AttachmentRegistry()
    const a = document.createElement('div')
    const b = document.createElement('div')
    const hudListener = vi.fn()
    const badgeListener = vi.fn()

    registry.onContainersChange('hud', hudListener)
    registry.onContainersChange('badge', badgeListener)

    registry.addContainer('hud', 'inst-1', a)
    registry.addContainer('badge', 'inst-2', b)

    expect(hudListener).toHaveBeenLastCalledWith([
      { instanceId: 'inst-1', container: a },
    ])
    expect(badgeListener).toHaveBeenLastCalledWith([
      { instanceId: 'inst-2', container: b },
    ])
  })
})
