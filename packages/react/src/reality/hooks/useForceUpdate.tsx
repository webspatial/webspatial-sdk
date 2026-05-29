import React, { useCallback, useState } from 'react'
type Props = {
  children?: React.ReactNode
}
export const useForceUpdate = () => {
  const [, setTick] = useState(0)
  return useCallback(() => setTick(tick => tick + 1), [])
}
