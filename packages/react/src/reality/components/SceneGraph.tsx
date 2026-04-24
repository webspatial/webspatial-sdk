import React from 'react'
import { ParentContext } from '../context'
export type SceneGraphProps = {
  children?: React.ReactNode
}
export const SceneGraph: React.FC<SceneGraphProps> = ({ children }) => {
  return (
    <ParentContext.Provider value={null}>{children}</ParentContext.Provider>
  )
}
