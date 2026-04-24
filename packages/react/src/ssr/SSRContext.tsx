import React, { createContext, useState, useEffect } from 'react'

export const SSRContext = createContext(false)

export type SSRProviderProps = {
  isSSR?: boolean
  children: React.ReactNode
}

export const SSRProvider = ({
  isSSR: initialIsSSR = true,
  children,
}: SSRProviderProps) => {
  const [isSSR, setIsSSR] = useState(initialIsSSR)

  useEffect(() => {
    if (isSSR) {
      setIsSSR(false)
    }
  }, [])

  return <SSRContext.Provider value={isSSR}>{children}</SSRContext.Provider>
}
