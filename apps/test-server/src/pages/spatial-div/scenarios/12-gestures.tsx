import React, { useState } from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

export default function Gestures() {
  const [on, setOn] = useState(false)
  const [log, push, clear] = useLog(22)

  return (
    <Scenario
      title="Spatial gestures versus web input"
      expect="With handlers off, only web pointer/click events fire. With handlers on, SDK spatial tap/drag events appear in the log alongside web events. Nested web buttons still receive clicks. These handlers only log; they do not move the panel."
      watch="Spatial handlers swallowing web click; web click firing with no spatial tap on a runtime that should have both; nested button click attributed to the parent; drag start without a matching end."
      controls={
        <>
          <Btn
            on={on}
            hint="not CSS — attaches onSpatialTap / onSpatialDragStart / onSpatialDragEnd (log only, no movement)"
            onClick={() => setOn(!on)}
          >
            spatial tap / drag handlers {on ? 'on' : 'off'}
          </Btn>
          <Btn onClick={clear}>clear log</Btn>
        </>
      }
      css={`.panel { --xr-back: 80; }\n.panel.nested { --xr-back: 30; }\n/* handlers ${on ? 'ON' : 'off'}: onSpatialTap / onSpatialDragStart / onSpatialDragEnd */`}
      readout={log || 'click / tap / drag events appear here'}
    >
      <Pair
        render={xr => (
          <Panel
            xr={xr}
            back={80}
            style={{ flexDirection: 'column', gap: 8, height: 180 }}
            onSpatialTap={
              on
                ? () => push(`${xr ? 'xr' : 'dom'} SDK spatial tap`)
                : undefined
            }
            onSpatialDragStart={
              on
                ? () => push(`${xr ? 'xr' : 'dom'} SDK spatial drag start`)
                : undefined
            }
            onSpatialDragEnd={
              on
                ? () => push(`${xr ? 'xr' : 'dom'} SDK spatial drag end`)
                : undefined
            }
            onPointerDown={() =>
              push(`${xr ? 'xr' : 'dom'} panel web pointerdown`)
            }
            onClick={() =>
              push(`${xr ? 'xr' : 'dom'} panel web click (bubbled)`)
            }
          >
            <button
              className="px-2 py-1 bg-white text-black rounded text-xs"
              onClick={() => push(`${xr ? 'xr' : 'dom'} button web click`)}
            >
              click me
            </button>
            <Panel
              xr={xr}
              back={30}
              className="small"
              style={{ background: '#b5562f' }}
            >
              <button
                className="px-2 py-1 bg-white text-black rounded text-xs"
                onClick={() =>
                  push(`${xr ? 'xr' : 'dom'} nested button web click`)
                }
              >
                nested web button
              </button>
            </Panel>
          </Panel>
        )}
        height={220}
      />
    </Scenario>
  )
}
