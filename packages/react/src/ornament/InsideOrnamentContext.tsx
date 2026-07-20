import { createContext, useContext } from 'react'

export const InsideOrnamentContext = createContext(false)
export const useInsideOrnament = () => useContext(InsideOrnamentContext)
