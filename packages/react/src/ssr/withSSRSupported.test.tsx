import React from 'react'
import { render, waitFor, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, afterEach } from 'vitest'
import { withSSRSupported } from './withSSRSupported'
import { SSRProvider } from './SSRContext'
import { useSSRPhase } from './useSSRPhase'

vi.mock('./useSSRPhase', () => ({
  useSSRPhase: vi.fn(),
}))

const RealComponent = () => <div data-testid="real">Real Component</div>
const SSRComponent = withSSRSupported(RealComponent)

describe('withSSRSupported', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  describe('with SSRProvider', () => {
    it('1. server return fake div', () => {
      vi.mocked(useSSRPhase).mockReturnValue('ssr')

      const { container } = render(
        <SSRProvider>
          <SSRComponent />
        </SSRProvider>,
      )

      expect(container.innerHTML).toBe('<div></div>')
    })

    it('2. client first render fake div, 3. client then render real div', async () => {
      // 2. client first render fake div
      vi.mocked(useSSRPhase).mockReturnValue('hydrate')

      const { container, getByTestId, rerender } = render(
        <SSRProvider>
          <SSRComponent />
        </SSRProvider>,
      )
      expect(container.innerHTML).toBe('<div></div>')

      vi.mocked(useSSRPhase).mockReturnValue('after-hydrate')
      rerender(
        <SSRProvider>
          <SSRComponent />
        </SSRProvider>,
      )

      // 3. client then render real div
      await waitFor(() => {
        expect(getByTestId('real')).toBeTruthy()
      })
    })

    it('4. client navigation then render real div', () => {
      vi.mocked(useSSRPhase).mockReturnValue('after-hydrate')

      const { getByTestId } = render(
        <SSRProvider isSSR={false}>
          <SSRComponent />
        </SSRProvider>,
      )

      expect(getByTestId('real')).toBeTruthy()
    })
  })

  describe('without SSRProvider (CSR)', () => {
    it('1. client directly render real div', () => {
      vi.mocked(useSSRPhase).mockReturnValue('after-hydrate')
      const { getByTestId } = render(<SSRComponent />)
      expect(getByTestId('real')).toBeTruthy()
    })
  })
})
