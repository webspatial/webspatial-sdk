import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React from 'react'
import { MENU_ITEMS } from '../menuData'
import {
  dropdownMenuLabelStyle,
  dropdownMenuSeparatorStyle,
  getDropdownMenuItemStyle,
} from '../menuLayout'
import type { MenuLogFn } from '../types'

export function MenuItems({ onSelect }: { onSelect: MenuLogFn }) {
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
