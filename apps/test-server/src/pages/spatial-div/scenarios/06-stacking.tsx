import React, { useState } from 'react'
import { Btn, Pair, Panel, Scenario } from '../shared'

export default function Stacking() {
  const [aOnTop, setAOnTop] = useState(true) // CSS z-index
  const [bNearer, setBNearer] = useState(true) // physical depth
  const [xrZ, setXrZ] = useState(false) // --xr-z-index override
  const [cover, setCover] = useState(false) // outside stacking group
  const [group, setGroup] = useState(false) // parent opacity group

  const css = [
    `.stack {`,
    `  position: relative; isolation: isolate; height: 200px;`,
    `  opacity: ${group ? '0.65' : '1'};`,
    `}`,
    `.panel.a { z-index: ${aOnTop ? 2 : 1}; --xr-back: ${bNearer ? 20 : 120}; }`,
    `.panel.b { z-index: ${aOnTop ? 1 : 2}; --xr-back: ${bNearer ? 120 : 20};${xrZ ? ' --xr-z-index: 5;' : ''} }`,
    cover
      ? `.cover { position: absolute; inset: 30px 10px; z-index: 999; }  /* not spatial */`
      : `/* no cover */`,
  ].join('\n')

  return (
    <Scenario
      title="Stacking and depth order"
      expect="Decision needed. Plain DOM orders A/B purely by z-index. With depth involved: does CSS z-index win, does physical --xr-back win, and can a nearer child render above a sibling outside its parent's stacking context (the orange cover, z-index 999)? An opacity group on the stack parent should apply once to A/B together."
      watch="Native depth bias silently overriding z-index; --xr-z-index and z-index disagreeing; cover hides a panel that is physically nearer than it; nested panel escaping the parent's opacity group."
      controls={
        <>
          <Btn
            on={aOnTop}
            hint={`.panel.a { z-index: ${aOnTop ? 1 : 2}; } .panel.b { z-index: ${aOnTop ? 2 : 1}; }`}
            onClick={() => setAOnTop(!aOnTop)}
          >
            z-index: {aOnTop ? 'A=2 B=1' : 'A=1 B=2'}
          </Btn>
          <Btn
            on={bNearer}
            hint={`.panel.a { --xr-back: ${bNearer ? 120 : 20}; } .panel.b { --xr-back: ${bNearer ? 20 : 120}; }`}
            onClick={() => setBNearer(!bNearer)}
          >
            --xr-back: {bNearer ? 'A=20 B=120' : 'A=120 B=20'}
          </Btn>
          <Btn
            on={xrZ}
            hint=".panel.b { --xr-z-index: 5; }  /* A unset — separate from CSS z-index */"
            onClick={() => setXrZ(!xrZ)}
          >
            --xr-z-index B=5 (A unset)
          </Btn>
          <Btn
            on={cover}
            hint=".cover { position: absolute; z-index: 999; }  /* ordinary DOM, outside .stack */"
            onClick={() => setCover(!cover)}
          >
            cover outside stacking group (z 999)
          </Btn>
          <Btn
            on={group}
            hint=".stack { opacity: 0.65; }  /* CSS stacking / opacity group on the parent */"
            onClick={() => setGroup(!group)}
          >
            parent opacity group .65
          </Btn>
        </>
      }
      css={css}
    >
      <Pair
        render={xr => (
          <div style={{ position: 'relative' }}>
            <div className="stack" style={{ opacity: group ? 0.65 : 1 }}>
              <Panel
                xr={xr}
                className="a"
                back={bNearer ? 20 : 120}
                style={{ zIndex: aOnTop ? 2 : 1 }}
              >
                A
              </Panel>
              <Panel
                xr={xr}
                className="b"
                back={bNearer ? 120 : 20}
                zi={xrZ ? 5 : undefined}
                style={{ zIndex: aOnTop ? 1 : 2 }}
              >
                B
              </Panel>
            </div>
            {cover && <div className="cover">cover (z 999, not spatial)</div>}
          </div>
        )}
        height={220}
      />
    </Scenario>
  )
}
