import React, { useState } from 'react'
import { Btn, Pair, Panel, Scenario } from '../shared'

export default function Clipping() {
  const [hidden, setHidden] = useState(true)
  const [round, setRound] = useState(true)
  const [circle, setCircle] = useState(false)
  const [raised, setRaised] = useState(true)
  const [spatialParent, setSpatialParent] = useState(false)
  const [spatialChild, setSpatialChild] = useState(true)

  const css = [
    `.clip {`,
    `  width: 240px; height: 160px; position: relative;`,
    `  overflow: ${hidden ? 'hidden' : 'visible'};`,
    `  border-radius: ${round ? '24px' : '0'};`,
    circle ? `  clip-path: circle(45%);` : `  /* no clip-path */`,
    spatialParent
      ? `  --xr-back: 20;  /* enable-xr on parent */`
      : `  /* parent is ordinary DOM */`,
    `}`,
    `.clip .panel {`,
    `  position: absolute; left: 150px; top: 40px;`,
    `  --xr-back: ${raised ? 100 : 0};`,
    `  /* child enable-xr: ${spatialChild ? 'yes' : 'no'} */`,
    `}`,
  ].join('\n')

  return (
    <Scenario
      title="Clipping and rounded corners"
      expect="Decision needed. Plain DOM clips the child at the parent's edge and corner radius. For a raised spatial child the candidate rule is: clipped at the parent's sides (X/Y), unclipped in front (Z). An ordinary (non-xr) child should stay clipped even when the parent is spatial."
      watch="Native child surface ignores overflow:hidden entirely and escapes the parent, or is clipped by a rectangle that ignores border-radius / clip-path. Spatial parent + ordinary child disagreeing with spatial parent + spatial child."
      controls={
        <>
          <Btn
            on={hidden}
            hint=".clip { overflow: hidden; }  /* lab.css .clip.hidden */"
            onClick={() => setHidden(!hidden)}
          >
            overflow: hidden
          </Btn>
          <Btn
            on={round}
            hint=".clip { border-radius: 24px; }  /* lab.css .clip.round */"
            onClick={() => setRound(!round)}
          >
            border-radius: 24px
          </Btn>
          <Btn
            on={circle}
            hint=".clip { clip-path: circle(45%); }  /* lab.css .clip.circle */"
            onClick={() => setCircle(!circle)}
          >
            clip-path: circle
          </Btn>
          <Btn
            on={raised}
            hint=".clip .panel { --xr-back: 100; }  /* inline on the overflowing child */"
            onClick={() => setRaised(!raised)}
          >
            child raised (--xr-back 100)
          </Btn>
          <Btn
            on={spatialParent}
            hint=".clip { enable-xr; --xr-back: 20; }  /* parent itself becomes spatial */"
            onClick={() => setSpatialParent(!spatialParent)}
          >
            spatial parent
          </Btn>
          <Btn
            on={spatialChild}
            hint="child enable-xr on/off — ordinary overflowing child vs spatial child"
            onClick={() => setSpatialChild(!spatialChild)}
          >
            spatial child
          </Btn>
        </>
      }
      css={css}
    >
      <Pair
        render={xr => (
          <div
            className={`clip ${hidden ? 'hidden' : ''} ${round ? 'round' : ''} ${circle ? 'circle' : ''}`}
            {...(spatialParent && xr ? { 'enable-xr': true } : {})}
            style={
              spatialParent
                ? ({ '--xr-back': 20 } as React.CSSProperties)
                : undefined
            }
          >
            <Panel
              xr={xr && spatialChild}
              back={raised ? 100 : 0}
              style={{ background: '#b5562f' }}
            >
              overflowing child
            </Panel>
          </div>
        )}
      />
    </Scenario>
  )
}
