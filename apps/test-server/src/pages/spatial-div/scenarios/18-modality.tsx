import React, { useEffect, useState } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

/**
 * 5c — Modality side effects.
 * Radix sets body.style.pointerEvents='none'; react-remove-scroll locks body;
 * aria-hidden/inert land on host siblings. The spatial document is untouched,
 * so a modal may fail to block spatial content — or block the dialog itself.
 */
export default function Modality() {
  const [peNone, setPeNone] = useState(false)
  const [scrollLock, setScrollLock] = useState(false)
  const [inertSib, setInertSib] = useState(false)
  const [ariaHidden, setAriaHidden] = useState(false)
  const [log, push, clear] = useLog(18)

  useEffect(() => {
    const body = document.body
    const prevPe = body.style.pointerEvents
    const prevOverflow = body.style.overflow
    if (peNone) body.style.pointerEvents = 'none'
    if (scrollLock) body.style.overflow = 'hidden'
    return () => {
      body.style.pointerEvents = prevPe
      body.style.overflow = prevOverflow
    }
  }, [peNone, scrollLock])

  const css = [
    peNone
      ? `document.body { pointer-events: none; }  /* Radix modal */`
      : `/* body pointer-events unchanged */`,
    scrollLock
      ? `document.body { overflow: hidden; }  /* react-remove-scroll */`
      : `/* body overflow unchanged */`,
    inertSib
      ? `.sibling { inert }  /* HTML inert on host sibling */`
      : `/* sibling not inert */`,
    ariaHidden
      ? `.sibling { aria-hidden: true }`
      : `/* sibling aria-hidden off */`,
    `.panel.modal { --xr-back: 120; pointer-events: auto; }  /* dialog content */`,
    `.panel.behind { --xr-back: 40; }  /* should be blocked while modal is up */`,
  ].join('\n')

  return (
    <Scenario
      title="Modality side effects"
      expect="When a host modal sets body pointer-events:none, overflow:hidden, inert, or aria-hidden on siblings, spatial content is included: the 'behind' panel stops receiving input and the 'dialog' panel (pointer-events:auto) still works. Scroll on the page is locked."
      watch="Behind spatial panel still clickable (body lock never reached the portal document); dialog panel also blocked because the host applied none to everything; inert/aria-hidden on host siblings leave the spatial surface interactive."
      controls={
        <>
          <Btn
            on={peNone}
            hint="document.body.style.pointerEvents = 'none'  /* Radix DismissableLayer / Dialog */"
            onClick={() => setPeNone(!peNone)}
          >
            body pointer-events: none
          </Btn>
          <Btn
            on={scrollLock}
            hint="document.body.style.overflow = 'hidden'  /* react-remove-scroll */"
            onClick={() => setScrollLock(!scrollLock)}
          >
            body overflow hidden
          </Btn>
          <Btn
            on={inertSib}
            hint="sibling.setAttribute('inert','') — host sibling, not the spatial document"
            onClick={() => setInertSib(!inertSib)}
          >
            inert on sibling
          </Btn>
          <Btn
            on={ariaHidden}
            hint="sibling.setAttribute('aria-hidden','true')"
            onClick={() => setAriaHidden(!ariaHidden)}
          >
            aria-hidden on sibling
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={css}
      readout={log || 'click the dialog / behind / sibling controls'}
    >
      <Pair
        render={xr => (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Panel
              xr={xr}
              back={40}
              className="small"
              {...(inertSib ? { inert: '' } : {})}
              {...(ariaHidden ? { 'aria-hidden': true } : {})}
            >
              <button
                className="px-2 py-1 bg-white text-black rounded text-xs"
                onClick={() =>
                  push(`${xr ? 'xr' : 'dom'} BEHIND / sibling click`)
                }
              >
                behind / sibling
              </button>
            </Panel>
            <Panel
              xr={xr}
              back={120}
              className="small"
              style={{ pointerEvents: 'auto', background: '#2f9b6b' }}
            >
              <button
                className="px-2 py-1 bg-white text-black rounded text-xs"
                onClick={() => push(`${xr ? 'xr' : 'dom'} DIALOG click`)}
              >
                dialog (pe:auto)
              </button>
            </Panel>
          </div>
        )}
        height={180}
      />
    </Scenario>
  )
}
