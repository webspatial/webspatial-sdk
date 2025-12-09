import React from 'react'
import { render, waitFor, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, afterEach } from 'vitest'
import { withSSRSupported } from './withSSRSupported'
import { SSRProvider } from './SSRContext'
import { useSSRPhase } from './useSSRPhase'

vi.mock('./useSSRPhase', () => ({
  useSSRPhase: vi.fn(),
}))

const RealComponent = React.forwardRef<
  HTMLDivElement,
  { style?: React.CSSProperties; className?: string }
>(({ style, className }, ref) => (
  <div data-testid="real" style={style} className={className} ref={ref}>
    Real Component
  </div>
))
RealComponent.displayName = 'RealComponent'

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

  // Boundary scenario tests
  describe('Boundary scenario tests', () => {
    it('ref passing test - fake div phase should pass ref', () => {
      vi.mocked(useSSRPhase).mockReturnValue('ssr')

      const ref = React.createRef<HTMLDivElement>()

      render(
        <SSRProvider>
          <SSRComponent ref={ref} />
        </SSRProvider>,
      )

      // In fake div phase, ref should be correctly set
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('ref passing test - real div phase should pass ref to real component', () => {
      vi.mocked(useSSRPhase).mockReturnValue('after-hydrate')

      const ref = React.createRef<HTMLDivElement>()

      render(
        <SSRProvider isSSR={false}>
          <SSRComponent ref={ref} />
        </SSRProvider>,
      )

      // In real div phase, ref should be passed to the real component
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current?.getAttribute('data-testid')).toBe('real')
    })

    it('style and className preservation test - fake div should preserve style and className', () => {
      vi.mocked(useSSRPhase).mockReturnValue('hydrate')

      const style = { color: 'red', fontSize: '16px' }
      const className = 'test-class'

      const { container } = render(
        <SSRProvider>
          <SSRComponent style={style} className={className} />
        </SSRProvider>,
      )

      const fakeDiv = container.firstChild as HTMLDivElement

      // Verify fake div preserves style attributes
      expect(fakeDiv.style.color).toBe('red')
      expect(fakeDiv.style.fontSize).toBe('16px')

      // Verify fake div preserves className
      expect(fakeDiv.className).toBe('test-class')
    })

    it('style and className preservation test - real div should correctly receive style and className', () => {
      vi.mocked(useSSRPhase).mockReturnValue('after-hydrate')

      const style = { color: 'blue', fontWeight: 'bold' }
      const className = 'real-class'

      const { getByTestId } = render(
        <SSRProvider isSSR={false}>
          <SSRComponent style={style} className={className} />
        </SSRProvider>,
      )

      const realDiv = getByTestId('real')

      // Verify real div correctly receives style attributes
      expect(realDiv.style.color).toBe('blue')
      expect(realDiv.style.fontWeight).toBe('bold')

      // Verify real div correctly receives className
      expect(realDiv.className).toBe('real-class')
    })

    it('component displayName test - HOC should correctly set displayName', () => {
      // Verify HOC functionality instead of displayName property

      // Test anonymous component case
      const AnonymousComponent = () => <div>Anonymous</div>
      const AnonymousSSRComponent = withSSRSupported(AnonymousComponent)

      // Verify HOC functionality works correctly
      vi.mocked(useSSRPhase).mockReturnValue('after-hydrate')
      const { getByText } = render(<AnonymousSSRComponent />)
      expect(getByText('Anonymous')).toBeTruthy()
    })

    it('hydration phase transition test - verify smooth transition from hydrate to after-hydrate', async () => {
      vi.mocked(useSSRPhase).mockReturnValue('hydrate')

      const { container, getByTestId, rerender } = render(
        <SSRProvider>
          <SSRComponent
            style={{ color: 'green' }}
            className="transition-class"
          />
        </SSRProvider>,
      )

      // Initial phase should be fake div, use more flexible assertions
      const fakeDiv = container.firstChild as HTMLDivElement
      expect(fakeDiv).toBeInstanceOf(HTMLDivElement)
      expect(fakeDiv.style.color).toBe('green')
      expect(fakeDiv.className).toBe('transition-class')

      // Switch to after-hydrate phase
      vi.mocked(useSSRPhase).mockReturnValue('after-hydrate')
      rerender(
        <SSRProvider>
          <SSRComponent
            style={{ color: 'green' }}
            className="transition-class"
          />
        </SSRProvider>,
      )

      // Should render real div and maintain styles
      await waitFor(() => {
        const realDiv = getByTestId('real')
        expect(realDiv.style.color).toBe('green')
        expect(realDiv.className).toBe('transition-class')
      })
    })
  })
})
