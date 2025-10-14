import React from 'react'
import { ParentContext } from '../context'
type Props = {
  children?: React.ReactNode
}
export const SceneGraph: React.FC<Props> = ({ children }) => {
  return (
    <ParentContext.Provider value={null}>{children}</ParentContext.Provider>
  )
}
