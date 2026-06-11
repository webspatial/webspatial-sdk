import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React from 'react'
import {
  dropdownMenuLabelStyle,
  dropdownMenuSeparatorStyle,
  getDropdownMenuItemStyle,
} from './menuLayout'

export type LogFn = (message: string) => void

export type MenuItem = {
  id: string
  label: string
  disabled?: boolean
  separatorBefore?: boolean
}

export const MENU_ITEMS: readonly MenuItem[] = [
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

export const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px',
  color: '#e5e7eb',
  background: '#0f172a',
}

export const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '8px',
  padding: '20px',
  background: 'rgba(15, 23, 42, 0.74)',
}

export const sectionGridStyle: React.CSSProperties = {
  marginTop: '24px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  alignItems: 'start',
}

export const spatialPanelStyle: React.CSSProperties = {
  ...panelStyle,
  minHeight: '220px',
  '--xr-back': 120,
  '--xr-depth': 80,
  '--xr-background-material': 'thin',
}

export const AvatarButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>((props, ref) => (
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
))
AvatarButton.displayName = 'AvatarButton'

export function MenuItems({ onSelect }: { onSelect: LogFn }) {
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

export function DropdownTriggerRow({
  label,
  showLabel = true,
}: {
  label?: string
  showLabel?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <DropdownMenu.Trigger asChild>
        <AvatarButton />
      </DropdownMenu.Trigger>
      {showLabel && label && (
        <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{label}</span>
      )}
    </div>
  )
}

export const dropdownContentDefaults = {
  sideOffset: 8,
  collisionPadding: 8,
  onCloseAutoFocus: (e: Event) => e.preventDefault(),
} as const
