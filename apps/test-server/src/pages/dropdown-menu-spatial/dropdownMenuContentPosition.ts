/** Shared Radix DropdownMenu.Content positioning — identical across all scenarios. */
export const dropdownMenuContentPosition = {
  side: 'bottom' as const,
  align: 'end' as const,
  sideOffset: 8,
  collisionPadding: 8,
  onCloseAutoFocus: (event: Event) => event.preventDefault(),
}
