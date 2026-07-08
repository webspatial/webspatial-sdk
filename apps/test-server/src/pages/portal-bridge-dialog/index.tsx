import * as RadixDialog from '@radix-ui/react-dialog'
import React, { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Manual test for the react-sdk portal document bridge.
 *
 * Two dialogs are exercised:
 * 1. An inline DismissableLayer-style dialog (the exact host-document
 *    listener pattern Radix uses: capture-phase `pointerdown` + `keydown`).
 * 2. A REAL Radix Dialog (@radix-ui/react-dialog) whose Content wraps a
 *    `<div enable-xr>` panel - the actual DismissableLayer/FocusScope code
 *    path.
 *
 * Expected with the bridge:
 * - Press/click a button INSIDE the spatial panel -> dialog stays open
 *   (the mirrored event's target is the placeholder inside the content
 *   subtree; the log shows it).
 * - Press Escape while focus is inside the spatial panel (hardware
 *   keyboard) -> dialog closes.
 * - Press/click outside the dialog -> dialog closes.
 *
 * The bridge arms its document interception eagerly when the first
 * spatialized container mounts, so this works even when the dialog's own
 * panel is the first/only spatial portal on the page: dismissal listeners
 * the dialog registers before the panel's async portal registration are
 * recorded and replayed. The keep-alive toggle remains only to compare
 * against the earlier behavior that required a pre-existing portal.
 */

type LogEntry = {
  id: number
  time: string
  text: string
}

let logId = 0

function useHostDocumentLog(enabled: boolean) {
  const [entries, setEntries] = useState<LogEntry[]>([])

  const append = useCallback((text: string) => {
    setEntries(prev =>
      [
        {
          id: ++logId,
          time: new Date().toLocaleTimeString(),
          text,
        },
        ...prev,
      ].slice(0, 30),
    )
  }, [])

  useEffect(() => {
    if (!enabled) return
    const describeTarget = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return 'null'
      const tag = target.tagName?.toLowerCase() ?? String(target)
      const id = target.id ? `#${target.id}` : ''
      const testId = target.getAttribute?.('data-bridge-role')
      return `${tag}${id}${testId ? ` [${testId}]` : ''}`
    }
    const onPointerDown = (event: Event) =>
      append(`document pointerdown -> target ${describeTarget(event)}`)
    const onKeyDown = (event: Event) =>
      append(`document keydown -> key "${(event as KeyboardEvent).key}"`)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [enabled, append])

  return { entries, append }
}

/**
 * Inline DismissableLayer: same host-document listeners Radix uses.
 * Does NOT check event.isTrusted (neither does Radix).
 */
function DismissableDialog(props: {
  onDismiss: (reason: string) => void
  children: React.ReactNode
}) {
  const { onDismiss, children } = props
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ownerDocument = contentRef.current!.ownerDocument
    const handlePointerDown = (event: Event) => {
      const content = contentRef.current
      if (content && !content.contains(event.target as Node)) {
        onDismiss('outside pointerdown')
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss('Escape keydown')
    }
    ownerDocument.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
    })
    ownerDocument.addEventListener('keydown', handleKeyDown)
    return () => {
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      })
      ownerDocument.removeEventListener('keydown', handleKeyDown)
    }
  }, [onDismiss])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        className="rounded-xl border border-gray-600 bg-[#16213a] p-6 shadow-2xl"
      >
        {children}
      </div>
    </div>
  )
}

const spatialPanelStyle: React.CSSProperties = {
  width: '300px',
  minHeight: '160px',
  padding: '16px',
  backgroundColor: '#1e3a5f',
  color: 'white',
  '--xr-back': 120 as React.CSSProperties['--xr-back'],
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

export default function PortalBridgeDialogTest() {
  const [open, setOpen] = useState(false)
  const [keepAlivePanel, setKeepAlivePanel] = useState(false)
  const [insideClicks, setInsideClicks] = useState(0)
  const [radixInsideClicks, setRadixInsideClicks] = useState(0)
  const [lastDismiss, setLastDismiss] = useState<string>('none yet')
  const { entries, append } = useHostDocumentLog(true)

  const handleDismiss = useCallback(
    (reason: string) => {
      setLastDismiss(reason)
      setOpen(false)
      append(`DIALOG DISMISSED (${reason})`)
    },
    [append],
  )

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Portal bridge dialog test</h1>
      <p className="text-gray-400 mb-6 max-w-2xl">
        A Radix-DismissableLayer-style modal whose content wraps an{' '}
        <code className="text-gray-300">enable-xr</code> panel. Pressing inside
        the spatial panel must NOT dismiss; Escape (hardware keyboard, focus
        inside the panel) and presses outside the dialog must dismiss.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          onClick={() => setOpen(true)}
        >
          Open dialog
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={keepAlivePanel}
            onChange={event => setKeepAlivePanel(event.target.checked)}
          />
          Keep-alive spatial panel (no longer required - eager arming; toggle
          kept for comparison)
        </label>
        <span className="text-sm text-gray-400">
          Last dismiss: <span className="text-gray-200">{lastDismiss}</span>
        </span>
      </div>

      {keepAlivePanel && (
        <div className="mb-6">
          <div
            enable-xr
            style={{
              width: '180px',
              padding: '10px',
              backgroundColor: '#233',
              color: '#9fb3c8',
              fontSize: '12px',
              borderRadius: '8px',
            }}
          >
            keep-alive spatial panel (keeps the portal bridge patch active)
          </div>
        </div>
      )}

      {open && (
        <DismissableDialog onDismiss={handleDismiss}>
          <h2 className="mb-3 text-lg font-medium">Dialog content</h2>
          <div
            enable-xr
            data-bridge-role="spatial-panel"
            style={spatialPanelStyle}
          >
            <span className="text-sm text-blue-200 font-medium">
              Inside spatial panel (child webview document)
            </span>
            <button
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
              onClick={() => setInsideClicks(count => count + 1)}
            >
              Click me - must NOT dismiss ({insideClicks})
            </button>
            <input
              className="rounded border border-gray-500 bg-gray-900 px-2 py-1 text-sm text-white"
              placeholder="Focus me, then press Escape"
            />
          </div>
          <p className="mt-3 max-w-xs text-xs text-gray-400">
            The panel above renders in a separate webview document; without the
            portal bridge its events never reach the host document listeners
            this dialog uses.
          </p>
          <button
            className="mt-4 rounded-lg border border-gray-500 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
            onClick={() => handleDismiss('close button')}
          >
            Close
          </button>
        </DismissableDialog>
      )}

      <section className="mb-6 rounded-xl border border-gray-800 bg-[#111] p-6">
        <h2 className="mb-2 text-lg font-medium text-gray-200">
          Real Radix Dialog (@radix-ui/react-dialog)
        </h2>
        <p className="mb-4 max-w-2xl text-sm text-gray-400">
          The actual DismissableLayer / FocusScope code path, with an{' '}
          <code className="text-gray-300">enable-xr</code> panel inside{' '}
          <code className="text-gray-300">Dialog.Content</code>. Same
          expectations: inside presses must not dismiss, Escape and outside
          presses must dismiss.
        </p>
        <RadixDialog.Root
          onOpenChange={nextOpen => {
            if (!nextOpen) {
              setLastDismiss('radix onOpenChange(false)')
              append('RADIX DIALOG DISMISSED')
            }
          }}
        >
          <RadixDialog.Trigger asChild>
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500">
              Open real Radix dialog
            </button>
          </RadixDialog.Trigger>
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
            <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-600 bg-[#16213a] p-6 shadow-2xl">
              <RadixDialog.Title className="mb-1 text-lg font-medium">
                Radix dialog content
              </RadixDialog.Title>
              <RadixDialog.Description className="mb-3 max-w-xs text-xs text-gray-400">
                The panel below is a spatial child webview; Radix must treat its
                events as inside this content.
              </RadixDialog.Description>
              <div
                enable-xr
                data-bridge-role="radix-spatial-panel"
                style={spatialPanelStyle}
              >
                <span className="text-sm text-blue-200 font-medium">
                  Inside spatial panel (child webview document)
                </span>
                <button
                  className="rounded-lg bg-purple-600 px-3 py-2 text-sm hover:bg-purple-500"
                  onClick={() => setRadixInsideClicks(count => count + 1)}
                >
                  Click me - must NOT dismiss ({radixInsideClicks})
                </button>
                <input
                  className="rounded border border-gray-500 bg-gray-900 px-2 py-1 text-sm text-white"
                  placeholder="Focus me, then press Escape"
                />
              </div>
              <RadixDialog.Close asChild>
                <button className="mt-4 rounded-lg border border-gray-500 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700">
                  Close
                </button>
              </RadixDialog.Close>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>
      </section>

      <section className="rounded-xl border border-gray-800 bg-[#111] p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-300">
          Host document listener log (capture-phase pointerdown + keydown)
        </h2>
        <ul className="max-h-64 space-y-1 overflow-auto text-xs text-gray-400">
          {entries.length === 0 && <li>No events observed yet.</li>}
          {entries.map(entry => (
            <li key={entry.id}>
              <span className="text-gray-600">{entry.time}</span>{' '}
              <span
                className={
                  entry.text.startsWith('DIALOG')
                    ? 'text-amber-300'
                    : 'text-gray-300'
                }
              >
                {entry.text}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
