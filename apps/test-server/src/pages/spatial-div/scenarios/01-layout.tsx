import React, { useRef, useState } from 'react'
import { Btn, Pair, Panel, Scenario, useRect } from '../shared'

export default function Layout() {
  const [w, setW] = useState(440)
  const [cols, setCols] = useState(1)
  const [sibBefore, setSibBefore] = useState(false)
  const [narrow, setNarrow] = useState(false) // ancestor-driven via class, no inline style
  const [pad, setPad] = useState(false)
  const xrRef = useRef<HTMLDivElement>(null)
  const rect = useRect(xrRef)

  const css = [
    `/* Wrapper padding 40px — inline on the ancestor of .grid-parent */`,
    `.wrapper {`,
    `  padding: ${pad ? '40px' : '0'};`,
    `}`,
    ``,
    `/* Parent width / Grid cols — inline on .grid-parent (lab.css also sets display:grid; gap:12px) */`,
    `.grid-parent {`,
    `  display: grid;`,
    `  gap: 12px;`,
    `  padding: 12px;`,
    narrow
      ? `  /* width omitted so the ancestor class can win */`
      : `  width: ${w}px;`,
    `  grid-template-columns: repeat(${cols}, 1fr);`,
    `}`,
    ``,
    `/* Ancestor class → width 280 — stylesheet rule, no inline width */`,
    `.grid-parent.narrow-by-ancestor { width: 280px; }  /* ${narrow ? 'ON' : 'off'} */`,
    ``,
    `/* Insert sibling before — extra .sib node before .panel */`,
    sibBefore
      ? `.sib { height: 56px; }  /* inserted before .panel */`
      : `/* no inserted sibling */`,
    ``,
    `.panel { width: 200px; height: 120px; --xr-back: 80; }`,
  ].join('\n')

  return (
    <Scenario
      title="Layout and updates"
      expect="Panel geometry follows host layout on every reflow: parent resize, sibling insertion, column change, ancestor class change."
      watch="Any change that reflows the host but does not move the native panel. Ancestor-driven changes (class on grandparent, padding on wrapper) are the likely gaps."
      controls={
        <>
          <Btn
            hint={`.grid-parent { width: ${w === 440 ? 300 : 440}px; }  /* inline style */`}
            onClick={() => setW(w === 440 ? 300 : 440)}
          >
            Parent width {w}px
          </Btn>
          <Btn
            on={cols === 2}
            hint={`.grid-parent { grid-template-columns: repeat(${cols === 1 ? 2 : 1}, 1fr); }  /* inline style */`}
            onClick={() => setCols(cols === 1 ? 2 : 1)}
          >
            Grid cols {cols}
          </Btn>
          <Btn
            on={sibBefore}
            hint={
              sibBefore
                ? 'remove the extra .sib node before .panel'
                : 'insert <div class="sib"> before .panel — sibling reflow, panel CSS unchanged'
            }
            onClick={() => setSibBefore(!sibBefore)}
          >
            Insert sibling before
          </Btn>
          <Btn
            on={narrow}
            hint={
              narrow
                ? 'remove class narrow-by-ancestor; restore inline width'
                : '.grid-parent.narrow-by-ancestor { width: 280px; }  /* lab.css, no inline width */'
            }
            onClick={() => setNarrow(!narrow)}
          >
            Ancestor class → width 280
          </Btn>
          <Btn
            on={pad}
            hint={
              pad
                ? '.wrapper { padding: 0; }  /* inline on the ancestor of .grid-parent */'
                : '.wrapper { padding: 40px; }  /* inline on the ancestor of .grid-parent */'
            }
            onClick={() => setPad(!pad)}
          >
            Wrapper padding 40px
          </Btn>
        </>
      }
      css={css}
      readout={`enable-xr panel rect (host DOM): ${rect}\nCompare with where the native panel is drawn.`}
    >
      <Pair
        render={xr => (
          <div style={{ padding: pad ? 40 : 0 }}>
            <div
              className={`grid-parent ${narrow ? 'narrow-by-ancestor' : ''}`}
              style={{
                width: narrow ? undefined : w,
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
              }}
            >
              {sibBefore && <div className="sib">inserted sibling</div>}
              <Panel xr={xr} ref={xr ? xrRef : undefined} back={80}>
                panel
              </Panel>
              <div className="sib">sibling</div>
            </div>
          </div>
        )}
      />
    </Scenario>
  )
}
