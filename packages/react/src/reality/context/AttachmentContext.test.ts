import { describe, expect, it, vi } from 'vitest'
import { AttachmentRegistry } from './AttachmentContext'

describe('AttachmentRegistry', () => {
  it('keys containers by asset id', () => {
    const registry = new AttachmentRegistry()
    const first = document.createElement('div')
    const second = document.createElement('div')

    registry.addContainer('asset-a', 'instance-1', first)
    registry.addContainer('asset-b', 'instance-2', second)

    expect(registry.getContainers('asset-a')).toEqual([
      { instanceId: 'instance-1', container: first },
    ])
    expect(registry.getContainers('asset-b')).toEqual([
      { instanceId: 'instance-2', container: second },
    ])
  })

  it('notifies listeners for the matching asset id only', () => {
    const registry = new AttachmentRegistry()
    const container = document.createElement('div')
    const matchingListener = vi.fn()
    const otherListener = vi.fn()

    registry.onContainersChange('asset-a', matchingListener)
    registry.onContainersChange('asset-b', otherListener)

    registry.addContainer('asset-a', 'instance-1', container)

    expect(matchingListener).toHaveBeenCalledWith([
      { instanceId: 'instance-1', container },
    ])
    expect(otherListener).not.toHaveBeenCalled()
  })
})
