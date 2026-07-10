import * as RadixDialog from '@radix-ui/react-dialog'
import React, { useState } from 'react'

export default function PortalBridgeDialogTest() {
  const [clicks, setClicks] = useState(0)

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Radix Dialog + WebSpatial</h1>
      <p className="text-gray-400 mb-8">
        Open the dialog and interact with the spatial panel inside.
      </p>

      <RadixDialog.Root>
        <RadixDialog.Trigger asChild>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500">
            Open dialog
          </button>
        </RadixDialog.Trigger>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 bg-black/60" />
          <RadixDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#16213a] p-6 text-white shadow-2xl">
            <RadixDialog.Title className="mb-4 text-lg font-medium">
              Radix dialog
            </RadixDialog.Title>
            <div
              enable-xr
              style={{
                width: '260px',
                padding: '16px',
                backgroundColor: '#1e3a5f',
                color: 'white',
                '--xr-back': 120 as React.CSSProperties['--xr-back'],
                borderRadius: '12px',
              }}
            >
              <button
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
                onClick={() => setClicks(c => c + 1)}
              >
                Click inside spatial panel ({clicks})
              </button>
            </div>
            <RadixDialog.Close asChild>
              <button className="mt-4 rounded-lg border border-gray-500 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700">
                Close
              </button>
            </RadixDialog.Close>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </div>
  )
}
