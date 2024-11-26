import { useState } from 'react'

export function useForceUpdate() {
  const [, setToggle] = useState(false)
  return () => setToggle(toggle => !toggle)
}
