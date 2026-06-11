import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  SpatialOverlay,
  useSpatialPortalContainer,
} from '@webspatial/react-sdk'
import React, { useCallback, useEffect } from 'react'
import {
  dropdownMenuFloatingGeometry,
  dropdownMenuOverflowTestStyle,
  dropdownMenuPanelStyle,
  dropdownMenuLabelStyle,
  dropdownMenuSeparatorStyle,
  getDropdownMenuItemStyle,
} from './menuLayout'
import {
  DropdownTriggerRow,
  LogFn,
  MENU_ITEMS,
  MenuItems,
  dropdownContentDefaults,
  panelStyle,
} from './shared'

const overflowMenuStyle: React.CSSProperties = {
  ...dropdownMenuOverflowTestStyle,
  '--xr-back': dropdownMenuFloatingGeometry.back,
  '--xr-depth': dropdownMenuFloatingGeometry.depth,
  '--xr-background-material': dropdownMenuFloatingGeometry.backgroundMaterial,
}

const shortParentPanelStyle: React.CSSProperties = {
  '--xr-back': 120,
  '--xr-depth': 80,
  '--xr-background-material': 'thin',
  height: '96px',
  minHeight: '96px',
  maxHeight: '96px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: '2px dashed rgba(56, 189, 248, 0.55)',
  outlineOffset: '-2px',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '8px',
  padding: '20px',
  background: 'rgba(15, 23, 42, 0.74)',
}

function MeasureSkeleton() {
  return (
    <>
      <div style={dropdownMenuLabelStyle}>Signed out</div>
      {MENU_ITEMS.map(item => (
        <React.Fragment key={item.id}>
          {item.separatorBefore && <div style={dropdownMenuSeparatorStyle} />}
          <div
            className="dropdown-spatial-menu-item"
            style={getDropdownMenuItemStyle(item.disabled)}
          >
            {item.label}
          </div>
        </React.Fragment>
      ))}
      <div style={dropdownMenuSeparatorStyle} />
      <div
        className="dropdown-spatial-menu-item"
        style={getDropdownMenuItemStyle()}
      >
        More actions
      </div>
    </>
  )
}

function NestedOverlaySubmenu({ onSelect }: { onSelect: LogFn }) {
  const submenuPortal = useSpatialPortalContainer()
  if (!submenuPortal) return null

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger
        className="dropdown-spatial-menu-item"
        style={getDropdownMenuItemStyle()}
      >
        More actions
      </DropdownMenu.SubTrigger>

      <DropdownMenu.Portal container={submenuPortal}>
        <DropdownMenu.SubContent
          sideOffset={8}
          alignOffset={-4}
          collisionPadding={8}
          asChild
        >
          <SpatialOverlay
            className="dropdown-spatial-menu"
            data-name="Dropdown Scenario 3 Nested Menu"
            data-testid="nested-floating-menu-content"
            measureChildren={
              <div style={dropdownMenuPanelStyle}>
                <div
                  className="dropdown-spatial-menu-item"
                  style={getDropdownMenuItemStyle()}
                >
                  Nested item
                </div>
              </div>
            }
            style={{
              ...dropdownMenuPanelStyle,
              '--xr-back': 12,
              '--xr-depth': 20,
              '--xr-background-material': 'transparent',
            }}
          >
            <DropdownMenu.Item
              className="dropdown-spatial-menu-item"
              onSelect={() => onSelect('Nested item')}
              style={getDropdownMenuItemStyle()}
            >
              Nested item
            </DropdownMenu.Item>
          </SpatialOverlay>
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  )
}

function Scenario3Menu({
  onLog,
  open,
  onOpenChange,
}: {
  onLog: LogFn
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const portalContainer = useSpatialPortalContainer()

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen)
      onLog(`open change: ${nextOpen}`)
    },
    [onLog, onOpenChange],
  )

  const rootProps =
    open === undefined
      ? { onOpenChange: handleOpenChange }
      : { open, onOpenChange: handleOpenChange }

  return (
    <DropdownMenu.Root {...rootProps} modal={false}>
      <DropdownTriggerRow showLabel={false} />

      {portalContainer && (
        <DropdownMenu.Portal container={portalContainer}>
          <DropdownMenu.Content
            side="top"
            align="center"
            {...dropdownContentDefaults}
            asChild
          >
            <SpatialOverlay
              className="dropdown-spatial-menu"
              data-name="Dropdown Scenario 3 Menu"
              data-testid="spatial-overlay-menu-content"
              measureChildren={
                <div
                  className="dropdown-spatial-menu"
                  style={overflowMenuStyle}
                >
                  <MeasureSkeleton />
                </div>
              }
              style={overflowMenuStyle}
            >
              <MenuItems onSelect={onLog} />
              <DropdownMenu.Separator style={dropdownMenuSeparatorStyle} />
              <NestedOverlaySubmenu onSelect={onLog} />
            </SpatialOverlay>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      )}
    </DropdownMenu.Root>
  )
}

function getCurrentHref() {
  return typeof window === 'undefined' ? '' : window.location.href
}

export function Scenario3ChildOverlayMenu({
  onLog,
  open,
  onOpenChange,
  logAutoOpenProbe,
}: {
  onLog: LogFn
  open?: boolean
  onOpenChange?: (open: boolean) => void
  logAutoOpenProbe?: boolean
}) {
  const portalContainer = useSpatialPortalContainer()

  useEffect(() => {
    if (!logAutoOpenProbe) return
    onLog(
      `s3 auto flag: true portal:${Boolean(portalContainer)} href:${getCurrentHref()}`,
    )
  }, [logAutoOpenProbe, onLog, portalContainer])

  return (
    <div style={panelStyle}>
      <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>
        Scenario 3 — Child menu overflow test
      </h2>
      <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '13px' }}>
        Explicit <code>SpatialOverlay</code> child surface. The cyan-outlined
        panel below is only 96px tall — tap DB and check whether all menu items
        stay visible outside the outline, then open More actions to validate a
        nested overlay.
      </p>

      <div
        enable-xr
        data-name="Dropdown Scenario 3 Parent"
        style={shortParentPanelStyle}
      >
        <Scenario3Menu onLog={onLog} open={open} onOpenChange={onOpenChange} />
      </div>
    </div>
  )
}
