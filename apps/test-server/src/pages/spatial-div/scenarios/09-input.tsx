import React, { useRef, useState } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

export default function Input() {
  const [overlaySolid, setOverlaySolid] = useState(false)
  const [through, setThrough] = useState(false)
  const [stop, setStop] = useState(false)
  const [log, push, clear] = useLog(18)
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({
    dom: { x: 0, y: 0 },
    xr: { x: 0, y: 0 },
  })

  const tag = (xr: boolean) => (xr ? 'xr ' : 'dom')

  const css = [
    `.overlay { position: absolute; inset: 0; pointer-events: ${overlaySolid ? 'auto' : 'none'}; }`,
    `.panel.front { pointer-events: ${through ? 'none' : 'auto'}; --xr-back: 100; z-index: 2; }`,
    `.panel.back { --xr-back: 40; z-index: 1; }`,
    `.panel.draggable { touch-action: none; transform: translate(...); }`,
    `/* stopPropagation on btn1: ${stop ? 'ON' : 'off'} — not CSS */`,
  ].join('\n')

  return (
    <Scenario
      title="Pointer targeting and capture"
      expect="Clicks pass through the pointer-events:none overlay to the panel button (and are blocked when auto). The same toggle also makes the overlapping FRONT panel pass hits to BACK. Dragging the panel with setPointerCapture moves it; a click on the inner button fires only if the pointer barely moved. Capture on the spatial handle should survive leaving the panel. stopPropagation on the button prevents the panel's click handler."
      watch="Overlay ignored or always blocking on the xr side; FRONT always winning even with pointer-events:none; drag gesture eaten by native (no pointermove), or click firing after a drag; lostpointercapture when the pointer leaves the xr panel; propagation order differing between sides."
      controls={
        <>
          <Btn
            on={overlaySolid}
            hint=".overlay { pointer-events: auto; }  /* default is none — hits pass through to the panel */"
            onClick={() => setOverlaySolid(!overlaySolid)}
          >
            overlay pointer-events: {overlaySolid ? 'auto' : 'none'}
          </Btn>
          <Btn
            on={through}
            hint=".panel.front { pointer-events: none; }  /* overlap hits should reach BACK */"
            onClick={() => setThrough(!through)}
          >
            front pointer-events: {through ? 'none' : 'auto'}
          </Btn>
          <Btn
            on={stop}
            hint="button.onclick → event.stopPropagation()  /* not CSS — panel onClick should not fire */"
            onClick={() => setStop(!stop)}
          >
            button stopPropagation
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={css}
      readout={log || 'events appear here — try click, drag, Tab'}
    >
      <Pair
        render={xr => {
          const k = xr ? 'xr' : 'dom'
          return (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              {/* 1. overlay pass-through */}
              <div style={{ position: 'relative' }}>
                <Panel
                  xr={xr}
                  back={60}
                  className="small"
                  onClick={() => push(`${tag(xr)} panel onClick (bubbled)`)}
                >
                  <button
                    tabIndex={0}
                    onFocus={() => push(`${tag(xr)} focus btn1`)}
                    onClick={e => {
                      if (stop) e.stopPropagation()
                      push(`${tag(xr)} btn1 click`)
                    }}
                    className="px-2 py-1 bg-white text-black rounded text-xs"
                  >
                    btn1
                  </button>
                </Panel>
                <div
                  className={`overlay ${overlaySolid ? 'solid' : ''}`}
                  onClick={() => push(`${tag(xr)} overlay caught click`)}
                />
              </div>
              {/* 2. draggable panel with pointer capture + inner button */}
              <Panel
                xr={xr}
                back={100}
                className="small draggable"
                style={{
                  transform: `translate(${pos[k].x}px, ${pos[k].y}px)`,
                  background: '#b5562f',
                }}
                onPointerDown={e => {
                  drag.current = {
                    x: e.clientX - pos[k].x,
                    y: e.clientY - pos[k].y,
                    moved: false,
                  }
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  push(`${tag(xr)} pointerdown`)
                }}
                onPointerMove={e => {
                  if (!drag.current) return
                  drag.current.moved = true
                  setPos(p => ({
                    ...p,
                    [k]: {
                      x: e.clientX - drag.current!.x,
                      y: e.clientY - drag.current!.y,
                    },
                  }))
                }}
                onPointerUp={() => {
                  push(`${tag(xr)} pointerup moved=${drag.current?.moved}`)
                  drag.current = null
                }}
              >
                <button
                  tabIndex={0}
                  onFocus={() => push(`${tag(xr)} focus btn2`)}
                  onClick={() => push(`${tag(xr)} btn2 click (after drag?)`)}
                  className="px-2 py-1 bg-white text-black rounded text-xs"
                >
                  btn2 · drag me
                </button>
              </Panel>
              {/* 3. overlapping spatial panels */}
              <div style={{ position: 'relative', width: 220, height: 140 }}>
                <Panel
                  xr={xr}
                  back={40}
                  className="small"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: 1,
                    background: '#2f9b6b',
                  }}
                >
                  <button
                    className="px-2 py-1 bg-white text-black rounded text-xs"
                    onClick={() => push(`${tag(xr)} BACK button click`)}
                  >
                    back
                  </button>
                </Panel>
                <Panel
                  xr={xr}
                  back={100}
                  className="small"
                  style={{
                    position: 'absolute',
                    left: 40,
                    top: 28,
                    zIndex: 2,
                    background: '#b5562f',
                    pointerEvents: through ? 'none' : 'auto',
                  }}
                >
                  <button
                    className="px-2 py-1 bg-white text-black rounded text-xs"
                    onClick={() => push(`${tag(xr)} FRONT button click`)}
                  >
                    front
                  </button>
                </Panel>
              </div>
              {/* 4. pointer capture that leaves the panel */}
              <Panel xr={xr} back={60} className="small">
                <button
                  className="px-2 py-1 bg-white text-black rounded text-xs"
                  style={{ touchAction: 'none' }}
                  onPointerDown={e => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    push(`${tag(xr)} spatial handle captured`)
                  }}
                  onPointerUp={() =>
                    push(`${tag(xr)} spatial handle pointerup`)
                  }
                  onPointerCancel={() =>
                    push(`${tag(xr)} spatial handle pointercancel`)
                  }
                  onLostPointerCapture={() =>
                    push(`${tag(xr)} spatial handle lostpointercapture`)
                  }
                >
                  drag outside this panel
                </button>
              </Panel>
            </div>
          )
        }}
        height={220}
      />
    </Scenario>
  )
}
