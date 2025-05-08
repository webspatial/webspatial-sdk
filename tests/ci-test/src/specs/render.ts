import { createRoot } from 'react-dom/client'
import React from 'react'

const container = document.getElementById('root')!
const root = createRoot(container)

export async function render(component: React.ReactNode) {
  root.render(component)
}

export function unmount() {
  root.unmount()
}
