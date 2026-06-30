import { useSpatialPortalContainer } from '@webspatial/react-sdk'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useCallback } from 'react'
import { AvatarButton } from '../components/AvatarButton'
import { MenuItems } from '../components/MenuItems'
import { dropdownMenuContentPosition } from '../dropdownMenuContentPosition'
import {
  panelStyle,
  scenario3FloatingMenuStyle,
  scenario3ParentStyle,
  scenarioDescriptionStyle,
  scenarioHeadingStyle,
} from '../pageStyles'
import type { MenuLogFn } from '../types'

function Scenario3ChildFloatingMenuContent({ onLog }: { onLog: MenuLogFn }) {
  const portalContainer = useSpatialPortalContainer()

  const handleOpenChange = useCallback(
    (open: boolean) => onLog(`open change: ${open}`),
    [onLog],
  )

  return (
    <DropdownMenu.Root modal={false} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger asChild>
        <AvatarButton />
      </DropdownMenu.Trigger>

      {portalContainer && (
        <DropdownMenu.Portal container={portalContainer}>
          <DropdownMenu.Content {...dropdownMenuContentPosition} asChild>
            <div
              enable-xr
              data-xr-overlay
              className="dropdown-spatial-menu"
              data-name="Dropdown Scenario 3 Menu"
              data-testid="floating-menu-content"
              style={scenario3FloatingMenuStyle}
            >
              <MenuItems onSelect={onLog} />
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      )}
    </DropdownMenu.Root>
  )
}

/**
 * Scenario 3 — Child SpatialDiv floating menu (overflow test)
 *
 * Structure:
 *   Parent div enable-xr  (short 96px panel)
 *   Trigger (inside parent)
 *   Portal → useSpatialPortalContainer()  (parent spatial window)
 *   Content asChild → div enable-xr  (child surface, escapes parent 2D bounds)
 */
export function Scenario3ChildFloatingMenu({ onLog }: { onLog: MenuLogFn }) {
  return (
    <div style={panelStyle}>
      <h2 style={scenarioHeadingStyle}>
        Scenario 3 — Child menu overflow test
      </h2>
      <p style={{ ...scenarioDescriptionStyle, margin: '0 0 12px' }}>
        Nested <code>enable-xr</code> child surface. The cyan-outlined panel
        below is only 96px tall — tap DB and check whether all 11 menu items
        stay visible below the outline (pass) or get cut off (clipped).
      </p>
      <div
        enable-xr
        data-name="Dropdown Scenario 3 Parent"
        style={scenario3ParentStyle}
      >
        <Scenario3ChildFloatingMenuContent onLog={onLog} />
      </div>
    </div>
  )
}
