import {
  createContext,
  ReactNode,
  useMemo,
  useContext,
  CSSProperties,
} from 'react'
import { createPortal, useCheckSpatialDivContext } from '@webspatial/react-sdk'
import { DialogContext } from './Dialog'

export const SpatialPopoveContext = createContext<number>(0)

let PopoverIndexStandardInstance = 0
let PopoverIndexPortalInstance = 0

export function PopoverRoot({ children }: { children: ReactNode }) {
  const { inStandardInstance } = useCheckSpatialDivContext()
  const value = useMemo(() => {
    if (inStandardInstance) {
      return PopoverIndexStandardInstance++
    } else {
      return PopoverIndexPortalInstance++
    }
  }, [inStandardInstance])

  return (
    <SpatialPopoveContext.Provider value={value}>
      {children}
    </SpatialPopoveContext.Provider>
  )
}

export function PopoverTrigger({ children }: { children: ReactNode }) {
  const { dispatch } = useContext(DialogContext)

  const popoverIndex = useContext(SpatialPopoveContext)
  console.log(popoverIndex)
  const onClick = () => {
    dispatch({ open: true, popoverIndex })
  }
  return <div onClick={onClick}>{children}</div>
}

export function PopoverContent({ children }: { children: ReactNode }) {
  const { state, dispatch } = useContext(DialogContext)
  const popoverIndex = useContext(SpatialPopoveContext)

  if (!state.open || state.popoverIndex !== popoverIndex || !document.body)
    return null
  // state.popoverIndex !== popoverIndex ||
  const style: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  }

  return createPortal(
    <div
      enable-xr
      style={style}
      onClick={e => {
        e.stopPropagation()
        dispatch({ open: false, popoverIndex: 0 })
      }}
    >
      {children}
    </div>,
    document.body,
  )
}
