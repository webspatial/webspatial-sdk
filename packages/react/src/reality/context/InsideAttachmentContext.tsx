import { createContext, useContext } from 'react'

export const InsideAttachmentContext = createContext(false)
export const useInsideAttachment = () => useContext(InsideAttachmentContext)
