import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSyncHeadStyles } from './useSyncHeadStyles'
import {
  disposeSyncParentHeadToChild,
  registerParentHeadSyncTarget,
} from './windowStyleSync'

vi.mock('./windowStyleSync', () => ({
  disposeSyncParentHeadToChild: vi.fn(),
  registerParentHeadSyncTarget: vi.fn(),
}))

describe('useSyncHeadStyles', () => {
  beforeEach(() => {
    vi.mocked(disposeSyncParentHeadToChild).mockClear()
    vi.mocked(registerParentHeadSyncTarget).mockClear()
  })

  it('registers and disposes the child window on mount', () => {
    const childWindow = {
      document: document.implementation.createHTMLDocument(),
    }
    const unregister = vi.fn()
    vi.mocked(registerParentHeadSyncTarget).mockReturnValue(unregister)

    function Test() {
      useSyncHeadStyles(childWindow as unknown as WindowProxy)
      return null
    }

    const { unmount } = render(<Test />)

    expect(registerParentHeadSyncTarget).toHaveBeenCalledWith(childWindow)

    unmount()

    expect(unregister).toHaveBeenCalledTimes(1)
    expect(disposeSyncParentHeadToChild).toHaveBeenCalledWith(childWindow)
  })

  it('does not register without a child window', () => {
    function Test() {
      useSyncHeadStyles(null)
      return null
    }

    render(<Test />)

    expect(registerParentHeadSyncTarget).not.toHaveBeenCalled()
    expect(disposeSyncParentHeadToChild).not.toHaveBeenCalled()
  })
})
