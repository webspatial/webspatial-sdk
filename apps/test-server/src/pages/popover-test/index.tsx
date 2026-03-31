import type { CSSProperties } from 'react'
import {
  enableDebugTool,
  useSpatialPortalContainer,
} from '@webspatial/react-sdk'
import * as Popover from '@radix-ui/react-popover'

enableDebugTool()

function SpatialPopoverDemo() {
  const container = useSpatialPortalContainer()

  return (
    <Popover.Root>
      <Popover.Trigger className="rounded bg-primary px-4 py-2 text-primary-content">
        Open popover
      </Popover.Trigger>
      <Popover.Portal container={container}>
        <Popover.Content
          className="z-[100] rounded-lg border border-base-300 bg-base-100 p-4 shadow-lg"
          sideOffset={8}
        >
          <p className="text-sm">Content portals to the spatial window body.</p>
          <Popover.Arrow className="fill-base-100" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default function PopoverTest() {
  return (
    <div className="h-screen w-screen">
      <div
        enable-xr
        style={{ '--xr-back': 80 } as CSSProperties}
        className="relative w-full bg-base-200 px-6 py-6 text-base-content"
      >
        <a
          href="#"
          onClick={() => history.go(-1)}
          className="mb-4 inline-block"
        >
          Go Back
        </a>
        <div className="mt-4">
          <SpatialPopoverDemo />
        </div>
      </div>
    </div>
  )
}
