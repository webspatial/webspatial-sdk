import type { MenuItem } from './types'

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
