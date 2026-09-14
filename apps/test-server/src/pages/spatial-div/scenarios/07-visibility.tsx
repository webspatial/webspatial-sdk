import React, { useState } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

export default function Visibility() {
  const [vh, setVh] = useState(false)
  const [half, setHalf] = useState(false)
  const [zero, setZero] = useState(false)
  const [gone, setGone] = useState(false)
  const [childVis, setChildVis] = useState(false)
  const [blur, setBlur] = useState(false)
  const [round, setRound] = useState(false)
  const [log, push, clear] = useLog()

  const css = [
    `.fx-parent {`,
    `  visibility: ${vh ? 'hidden' : 'visible'};`,
    `  opacity: ${zero ? '0' : half ? '0.5' : '1'};`,
    `  display: ${gone ? 'none' : 'inline-block'};`,
    blur ? `  filter: blur(3px);` : `  /* no filter */`,
    round
      ? `  border-radius: 32px; overflow: hidden;`
      : `  /* no radius clip */`,
    `}`,
    `.panel { --xr-back: 80;${childVis ? ' visibility: visible;' : ''} }`,
  ].join('\n')

  return (
    <Scenario
      title="Visibility and visual effects"
      expect="visibility:hidden on the parent hides the panel and it stops receiving input (click log stays silent). opacity 0 is not the same as display:none. A descendant visibility:visible may override a hidden ancestor. opacity/filter on the parent apply once to the whole subtree. Parent border-radius + overflow clips the panel's corners."
      watch="Panel still visible or still clickable while parent is hidden; opacity 0 still hit-testable; display:none leaving a native surface; child visibility:visible ignored on xr; opacity applied twice (0.25 instead of 0.5); corners handled by native, ignoring the parent's radius."
      controls={
        <>
          <Btn
            on={vh}
            hint=".fx-parent { visibility: hidden; }  /* lab.css .fx-parent.vhidden */"
            onClick={() => setVh(!vh)}
          >
            parent visibility: hidden
          </Btn>
          <Btn
            on={half}
            hint=".fx-parent { opacity: 0.5; }  /* lab.css .fx-parent.half */"
            onClick={() => setHalf(!half)}
          >
            parent opacity: .5
          </Btn>
          <Btn
            on={zero}
            hint=".fx-parent { opacity: 0; }  /* still in layout / may still hit-test */"
            onClick={() => setZero(!zero)}
          >
            parent opacity: 0
          </Btn>
          <Btn
            on={gone}
            hint=".fx-parent { display: none; }  /* removed from layout */"
            onClick={() => setGone(!gone)}
          >
            parent display: none
          </Btn>
          <Btn
            on={childVis}
            hint=".panel { visibility: visible; }  /* descendant override of a hidden ancestor */"
            onClick={() => setChildVis(!childVis)}
          >
            child visibility: visible
          </Btn>
          <Btn
            on={blur}
            hint=".fx-parent { filter: blur(3px); }  /* lab.css .fx-parent.blur */"
            onClick={() => setBlur(!blur)}
          >
            parent filter: blur
          </Btn>
          <Btn
            on={round}
            hint=".fx-parent { border-radius: 32px; overflow: hidden; }"
            onClick={() => setRound(!round)}
          >
            parent radius 32 + overflow hidden
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={css}
      readout={log || 'click / hover events appear here'}
    >
      <Pair
        render={xr => (
          <div
            className={`fx-parent ${vh ? 'vhidden' : ''} ${half ? 'half' : ''} ${zero ? 'zero' : ''} ${gone ? 'gone' : ''} ${blur ? 'blur' : ''} ${round ? 'round' : ''}`}
          >
            <Panel
              xr={xr}
              back={80}
              style={{ visibility: childVis ? 'visible' : undefined }}
              onPointerEnter={() => push(`${xr ? 'xr' : 'dom'} pointerenter`)}
            >
              <button
                className="px-3 py-1 bg-white text-black rounded"
                onClick={() =>
                  push(`${xr ? 'xr' : 'dom'} click (hidden=${vh})`)
                }
              >
                click me
              </button>
            </Panel>
          </div>
        )}
        height={200}
      />
    </Scenario>
  )
}
