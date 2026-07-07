export type LogEntry = {
  id: number
  message: string
}

export type MenuItem = {
  id: string
  label: string
  disabled?: boolean
  separatorBefore?: boolean
}

export type MenuLogFn = (message: string) => void
