import { useCallback, useState } from 'react'
export const useForceUpdate = () => {
  const [, setTick] = useState(0)
  return useCallback(() => setTick(tick => tick + 1), [])
}
