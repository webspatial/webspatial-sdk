import { afterEach, describe, expect, it, vi } from 'vitest'
import { claimAttachmentInstanceId } from './AttachmentEntity'

describe('claimAttachmentInstanceId', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the explicit id when unique', () => {
    const id = claimAttachmentInstanceId('hud-left')
    expect(id).toBe('hud-left')
  })

  it('warns and falls back to a generated id on duplicate explicit ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = claimAttachmentInstanceId('hud-dup')
    const second = claimAttachmentInstanceId('hud-dup')
    expect(first).toBe('hud-dup')
    expect(second).not.toBe('hud-dup')
    expect(second.startsWith('hud-dup_')).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('Duplicate id "hud-dup"')
  })

  it('auto-generates unique ids when no explicit id is given', () => {
    const a = claimAttachmentInstanceId()
    const b = claimAttachmentInstanceId()
    expect(a).toMatch(/^att_\d+$/)
    expect(b).toMatch(/^att_\d+$/)
    expect(a).not.toBe(b)
  })
})
