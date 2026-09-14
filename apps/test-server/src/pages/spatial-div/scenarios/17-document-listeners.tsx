import React, { useEffect } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

/**
 * 5b — Document-scoped listeners.
 * Radix DismissableLayer / Escape / focusin are sometimes bridged. pointermove,
 * wheel, contextmenu, and touch* often are not — they stay on the host document.
 */
const DOC_EVENTS = [
  'pointermove',
  'pointerdown',
  'wheel',
  'contextmenu',
  'touchstart',
  'touchend',
  'keydown',
  'focusin',
] as const

export default function DocumentListeners() {
  const [log, push, clear] = useLog(24)

  useEffect(() => {
    const on = (type: string) => (e: Event) => {
      const t = e.target
      const tag =
        t instanceof Element
          ? `${t.tagName.toLowerCase()}.${[...t.classList].slice(0, 2).join('.')}`
          : String(t)
      const extra =
        type === 'keydown' && 'key' in e
          ? ` key=${(e as KeyboardEvent).key}`
          : ''
      push(`document ${type} target=${tag}${extra}`)
    }
    const handlers = DOC_EVENTS.map(type => {
      const fn = on(type)
      document.addEventListener(type, fn, { capture: true, passive: true })
      return { type, fn }
    })
    return () => {
      handlers.forEach(({ type, fn }) =>
        document.removeEventListener(type, fn, { capture: true }),
      )
    }
  }, [push])

  return (
    <Scenario
      title="Document-scoped listeners"
      expect="Host document listeners (the Radix DismissableLayer model) see pointerdown, focusin, and Escape from both columns. pointermove, wheel, contextmenu, and touch* should also appear when those gestures happen on the spatial panel — otherwise dismiss/hover-outside logic is blind."
      watch="Spatial clicks never reach document pointerdown; move/wheel/contextmenu/touch stay on the portal document; Escape works but pointer-outside dismiss does not."
      controls={<Btn onClick={clear}>clear log</Btn>}
      css={`
        /* not CSS — document.addEventListener(capture) for:\n   pointermove, pointerdown, wheel, contextmenu,\n   touchstart, touchend, keydown (Escape), focusin */
      `}
      readout={
        log ||
        'interact with either panel — document-capture events appear here'
      }
    >
      <Pair
        render={xr => (
          <Panel
            xr={xr}
            back={80}
            style={{ flexDirection: 'column', gap: 8 }}
            onContextMenu={e => e.preventDefault()}
          >
            <button className="px-2 py-1 bg-white text-black rounded text-xs">
              focus / click / Escape
            </button>
            <input
              className="px-2 py-1 text-black text-xs rounded w-28"
              placeholder="focusin + type"
            />
            <div className="text-[10px] text-gray-300">
              wheel, right-click, drag, touch
            </div>
          </Panel>
        )}
        height={200}
      />
    </Scenario>
  )
}
