import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SpatialHelper } from '@xrsdk/runtime/dist'

function App() {
  const termDiv = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Set background color
    SpatialHelper.instance?.setBackgroundStyle(
      { material: { type: 'default' }, cornerRadius: 15 },
      '#00000000',
    )

    // Initialize terminal
    var term = new Terminal({
      theme: {
        background: '#00000000',
      },
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(termDiv.current!)
    term.write('Hello from Terminal!')

    // Handle input
    var prompt = () => {
      term.write('\r\n$ ')
    }
    term.onKey(e => {
      if (e.domEvent.key === 'Enter') {
        prompt()
      } else if (e.domEvent.key === 'Backspace') {
        var str = term.buffer.active
          .getLine(term.buffer.active.cursorY)
          ?.translateToString()
        if (str && str.trim().length > 2) {
          term.write('\b \b') // Move back, erase, move back
        }
      } else {
        term.write(e.key)
      }
    })
    prompt()
  }, [])
  return (
    <div
      ref={termDiv}
      className="w-full h-full p-2"
      style={{ backgroundColor: 'transparent' }}
    ></div>
  )
}

// Initialize react
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
