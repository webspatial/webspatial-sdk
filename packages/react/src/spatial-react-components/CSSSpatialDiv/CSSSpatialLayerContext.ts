import { createContext } from 'react'

// CSSSpatialLayerContext is used to mark the cssspatial layer of the cssspatial div, which is used to help hijacked ref.current find the correct cssparser div.
export const CSSSpatialLayerContext = createContext(0)
