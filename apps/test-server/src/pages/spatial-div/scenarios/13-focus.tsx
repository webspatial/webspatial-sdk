import React from 'react'
import { Btn, Pair, Panel, Scenario, useLog } from '../shared'

export default function Focus() {
  const [log, push, clear] = useLog(22)

  return (
    <Scenario
      title="Focus, keyboard, and editing"
      expect="Tab walks A (outside) → B (first panel) → C (second panel) → D (outside) in DOM order. Spatial depth does not silently redefine Tab order. Typing, text selection, IME composition, and contenteditable work on the visible field."
      watch="Focus skipping a spatial panel; caret or keyboard attached to a hidden host; composition events missing on xr; contenteditable not receiving selection; Tab order following --xr-back instead of DOM order."
      controls={<Btn onClick={clear}>clear log</Btn>}
      css={`/* no toggles — CSS is static */\ninput A { /* outside, before panels */ }\n.panel.B { --xr-back: 90; } input + [contenteditable]\n.panel.C { --xr-back: 30; } input\ninput D { /* outside, after panels */ }\n/* Tab order is DOM order, not --xr-back */`}
      readout={
        log ||
        'Tab from A through B and C to D — focus / IME events appear here'
      }
    >
      <Pair
        render={xr => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="text-xs text-gray-400">
              A · outside
              <input
                className="ml-2 px-2 py-1 text-black text-xs rounded"
                placeholder="start here, then Tab"
                onFocus={() => push(`${xr ? 'xr' : 'dom'} focus A outside`)}
              />
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Panel
                xr={xr}
                back={90}
                style={{ flexDirection: 'column', gap: 6, height: 140 }}
              >
                <label className="text-xs">
                  B · first panel
                  <input
                    className="ml-2 px-2 py-1 text-black text-xs rounded w-28"
                    placeholder="type / IME"
                    onFocus={() =>
                      push(`${xr ? 'xr' : 'dom'} focus B first panel`)
                    }
                    onCompositionStart={() =>
                      push(`${xr ? 'xr' : 'dom'} B compositionstart`)
                    }
                    onCompositionEnd={() =>
                      push(`${xr ? 'xr' : 'dom'} B compositionend`)
                    }
                  />
                </label>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  tabIndex={-1}
                  className="bg-white text-black text-xs px-2 py-1 rounded"
                >
                  Editable text: select me.
                </p>
              </Panel>
              <Panel
                xr={xr}
                back={30}
                className="small"
                style={{ background: '#2f9b6b', flexDirection: 'column' }}
              >
                <label className="text-xs">
                  C · second panel
                  <input
                    className="mt-1 px-2 py-1 text-black text-xs rounded w-24"
                    placeholder="then Tab out"
                    onFocus={() =>
                      push(`${xr ? 'xr' : 'dom'} focus C second panel`)
                    }
                  />
                </label>
              </Panel>
            </div>
            <label className="text-xs text-gray-400">
              D · outside
              <input
                className="ml-2 px-2 py-1 text-black text-xs rounded"
                placeholder="last field"
                onFocus={() => push(`${xr ? 'xr' : 'dom'} focus D outside`)}
              />
            </label>
          </div>
        )}
        height={280}
      />
    </Scenario>
  )
}
