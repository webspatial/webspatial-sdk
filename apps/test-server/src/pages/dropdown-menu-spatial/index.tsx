import {
  enableDebugTool,
  useSpatialPortalContainer,
} from '@webspatial/react-sdk'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  dropdownMenuContentStyle,
  dropdownMenuOverflowTestStyle,
  dropdownMenuFloatingGeometry,
  dropdownMenuLabelStyle,
  dropdownMenuPanelStyle,
  dropdownMenuSeparatorStyle,
  getDropdownMenuItemStyle,
} from './menuLayout'
import './menuLayout.css'

enableDebugTool()

type LogEntry = {
  id: number
  message: string
}

type MenuItem = {
  id: string
  label: string
  disabled?: boolean
  separatorBefore?: boolean
}

const MENU_ITEMS: readonly MenuItem[] = [
  { id: 'login', label: 'Login / Register' },
  { id: 'profile', label: 'Profile' },
  { id: 'workspace', label: 'My Workspace' },
  { id: 'about', label: 'About Doubao', separatorBefore: true },
  { id: 'whats-new', label: "What's New" },
  { id: 'docs', label: 'Documentation' },
  { id: 'settings', label: 'Settings', disabled: true, separatorBefore: true },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'help', label: 'Help Center', separatorBefore: true },
  { id: 'sign-out', label: 'Sign out' },
] as const

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px',
  color: '#e5e7eb',
  background: '#0f172a',
}

const sectionStyle: React.CSSProperties = {
  marginTop: '24px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  alignItems: 'start',
}

const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '8px',
  padding: '20px',
  background: 'rgba(15, 23, 42, 0.74)',
}

const spatialPanelStyle: React.CSSProperties = {
  ...panelStyle,
  minHeight: '220px',
  '--xr-back': 120,
  '--xr-depth': 80,
  '--xr-background-material': 'thin',
}

const floatingMenuStyle: React.CSSProperties = {
  ...dropdownMenuPanelStyle,
  '--xr-back': dropdownMenuFloatingGeometry.back,
  '--xr-depth': dropdownMenuFloatingGeometry.depth,
  '--xr-background-material': dropdownMenuFloatingGeometry.backgroundMaterial,
}

const scenario3FloatingMenuStyle: React.CSSProperties = {
  ...dropdownMenuOverflowTestStyle,
  '--xr-back': dropdownMenuFloatingGeometry.back,
  '--xr-depth': dropdownMenuFloatingGeometry.depth,
  '--xr-background-material': dropdownMenuFloatingGeometry.backgroundMaterial,
}

/** Short parent panel — only the trigger lives inside; menu overflows below. */
const scenario3ParentStyle: React.CSSProperties = {
  ...spatialPanelStyle,
  height: '96px',
  minHeight: '96px',
  maxHeight: '96px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: '2px dashed rgba(56, 189, 248, 0.55)',
  outlineOffset: '-2px',
}

const AvatarButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>((props, ref) => {
  return (
    <button
      {...props}
      ref={ref}
      aria-label="user-menu"
      style={{
        display: 'inline-flex',
        width: '52px',
        height: '52px',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #38bdf8, #f97316)',
        color: '#ffffff',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      DB
    </button>
  )
})

AvatarButton.displayName = 'AvatarButton'

function MenuItems({ onSelect }: { onSelect: (label: string) => void }) {
  return (
    <>
      <DropdownMenu.Label style={dropdownMenuLabelStyle}>
        Signed out
      </DropdownMenu.Label>
      {MENU_ITEMS.map(item => (
        <React.Fragment key={item.id}>
          {item.separatorBefore && (
            <DropdownMenu.Separator style={dropdownMenuSeparatorStyle} />
          )}
          <DropdownMenu.Item
            className="dropdown-spatial-menu-item"
            disabled={item.disabled}
            onSelect={() => onSelect(item.label)}
            style={getDropdownMenuItemStyle(item.disabled)}
          >
            {item.label}
          </DropdownMenu.Item>
        </React.Fragment>
      ))}
    </>
  )
}

function AvatarMenu({
  label,
  portalContainer,
  floatingContent,
  floatingMenuContentStyle,
  menuName,
  showLabel = true,
  open,
  onOpenChange,
  onLog,
}: {
  label: string
  portalContainer?: HTMLElement | null
  floatingContent?: boolean
  floatingMenuContentStyle?: React.CSSProperties
  /** SpatialDiv title for the floating menu webview (Safari Web Inspector). */
  menuName?: string
  showLabel?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onLog: (message: string) => void
}) {
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen)
      onLog(`open change: ${nextOpen}`)
    },
    [onLog, onOpenChange],
  )

  const menuProps =
    open === undefined
      ? { onOpenChange: handleOpenChange }
      : { open, onOpenChange: handleOpenChange }

  return (
    <DropdownMenu.Root {...menuProps} modal={!floatingContent}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <DropdownMenu.Trigger asChild>
          <AvatarButton />
        </DropdownMenu.Trigger>
        {showLabel && (
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{label}</span>
        )}
      </div>
      {portalContainer && (
        <DropdownMenu.Portal container={portalContainer}>
          {floatingContent ? (
            <DropdownMenu.Content
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={8}
              onCloseAutoFocus={e => e.preventDefault()}
              asChild
            >
              <div
                enable-xr
                className="dropdown-spatial-menu"
                data-name={menuName}
                data-testid="floating-menu-content"
                style={floatingMenuContentStyle ?? floatingMenuStyle}
              >
                <MenuItems onSelect={onLog} />
              </div>
            </DropdownMenu.Content>
          ) : (
            <DropdownMenu.Content
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={8}
              onCloseAutoFocus={e => e.preventDefault()}
              className="dropdown-spatial-menu"
              data-testid="flat-menu-content"
              style={dropdownMenuContentStyle}
            >
              <MenuItems onSelect={onLog} />
            </DropdownMenu.Content>
          )}
        </DropdownMenu.Portal>
      )}
    </DropdownMenu.Root>
  )
}

function SpatialDivFlatMenu({ onLog }: { onLog: (message: string) => void }) {
  const portalContainer = useSpatialPortalContainer()

  return (
    <AvatarMenu
      label="Portal container: nearest SpatialDiv window"
      portalContainer={portalContainer}
      onLog={onLog}
    />
  )
}

function SpatialDivChildFloatingMenu({
  onLog,
}: {
  onLog: (message: string) => void
}) {
  // Scenario 3 (contract form): nested `enable-xr` + Radix. The menu Content's
  // inner `div enable-xr` becomes a child SpatialDiv that rises in front of this
  // parent panel and escapes its 2D bounds. Interim portal target = the parent
  // spatial window (same as Scenario 2) until auto portal routing ships.
  const portalContainer = useSpatialPortalContainer()

  return (
    <AvatarMenu
      label="Child surface via nested enable-xr + Radix"
      portalContainer={portalContainer}
      floatingContent
      floatingMenuContentStyle={scenario3FloatingMenuStyle}
      menuName="Dropdown Scenario 3 Menu"
      showLabel={false}
      onLog={onLog}
    />
  )
}

export default function DropdownMenuSpatialTest() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const latestLog = logs[0]?.message ?? 'Menu log'

  const addLog = useCallback((source: string, item: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev =>
      [
        { id: Date.now(), message: `[${time}] ${source}: ${item}` },
        ...prev,
      ].slice(0, 8),
    )
  }, [])

  const logMainFloating = useCallback(
    (item: string) => addLog('main floating', item),
    [addLog],
  )
  const logSpatialFlat = useCallback(
    (item: string) => addLog('spatial flat', item),
    [addLog],
  )
  const logSpatialChildFloating = useCallback(
    (item: string) => addLog('spatial child floating', item),
    [addLog],
  )

  // Portal to document.body so fixed popper positioning is viewport-stable
  // (avoids sidebar/layout offset when using #root as the portal host).
  const rootPortalHost = useMemo(
    () => (typeof document === 'undefined' ? null : document.body),
    [],
  )

  // AVP probe: mirror overlay pushes into the page log (screenshot-visible).
  useEffect(() => {
    const mirror = (detail: {
      width: number
      height: number
      visible: boolean
    }) => {
      logSpatialChildFloating(
        `overlay push: ${detail.width}x${detail.height} visible:${detail.visible}`,
      )
    }
    ;(
      window as Window & {
        __webspatialOnOverlayUpdate?: typeof mirror
      }
    ).__webspatialOnOverlayUpdate = mirror
    const onOverlayUpdate = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          width: number
          height: number
          visible: boolean
        }>
      ).detail
      if (detail) mirror(detail)
    }
    window.addEventListener('webspatial-overlay-update', onOverlayUpdate)
    return () => {
      delete (
        window as Window & {
          __webspatialOnOverlayUpdate?: typeof mirror
        }
      ).__webspatialOnOverlayUpdate
      window.removeEventListener('webspatial-overlay-update', onOverlayUpdate)
    }
  }, [logSpatialChildFloating])

  return (
    <div style={pageStyle}>
      <a href="#" onClick={() => history.go(-1)} style={{ color: '#93c5fd' }}>
        Go Back
      </a>
      <h1 style={{ margin: '20px 0 8px', fontSize: '24px' }}>
        Radix DropdownMenu + SpatialDiv
      </h1>
      <p style={{ maxWidth: '760px', margin: 0, color: '#94a3b8' }}>
        Scenario 1: main-page menu with <code>div enable-xr</code> so the
        dropdown rises as a spatial surface. Scenario 2: menu inside SpatialDiv
        portals to the spatial window via{' '}
        <code>useSpatialPortalContainer()</code>. Scenario 3: nested{' '}
        <code>enable-xr</code> + Radix so the menu rises as a child SpatialDiv
        that escapes the parent panel bounds (spatial runtime only).
      </p>
      <div
        style={{
          marginTop: '12px',
          color: '#cbd5e1',
          fontSize: '12px',
        }}
      >
        {latestLog}
      </div>

      <section style={{ ...panelStyle, marginTop: '24px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>
          Scenario 1 — Main page floating menu
        </h2>
        <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '13px' }}>
          Portal to <code>document.body</code>. Use{' '}
          <code>DropdownMenu.Content asChild</code> with an inner{' '}
          <code>div enable-xr</code>.
        </p>
        <AvatarMenu
          label="Avatar on the main page"
          portalContainer={rootPortalHost}
          floatingContent
          menuName="Dropdown Scenario 1 Menu"
          onLog={logMainFloating}
        />
      </section>

      <div style={sectionStyle}>
        <div
          enable-xr
          data-name="Dropdown Scenario 2 Parent"
          style={spatialPanelStyle}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>
            Scenario 2 — SpatialDiv flat menu
          </h2>
          <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '13px' }}>
            Trigger and content stay in the same spatial window. Menu content is
            ordinary DOM (no <code>enable-xr</code> on the menu).
          </p>
          <SpatialDivFlatMenu onLog={logSpatialFlat} />
        </div>

        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>
            Scenario 3 — Child menu overflow test
          </h2>
          <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '13px' }}>
            Nested <code>enable-xr</code> child surface. The cyan-outlined panel
            below is only 96px tall — tap DB and check whether all 11 menu items
            stay visible below the outline (pass) or get cut off (clipped).
          </p>
          <div
            enable-xr
            data-name="Dropdown Scenario 3 Parent"
            style={scenario3ParentStyle}
          >
            <SpatialDivChildFloatingMenu onLog={logSpatialChildFloating} />
          </div>
        </div>
      </div>

      <pre
        style={{
          marginTop: '24px',
          minHeight: '88px',
          padding: '14px',
          borderRadius: '8px',
          background: '#020617',
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          fontSize: '12px',
        }}
      >
        {logs.length ? logs.map(log => log.message).join('\n') : latestLog}
      </pre>
    </div>
  )
}
