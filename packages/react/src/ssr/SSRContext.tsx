import React, { createContext, useState, useEffect } from 'react'

export const SSRContext = createContext(false)

export const SSRProvider = ({
  isSSR: initialIsSSR = true,
  children,
}: {
  isSSR?: boolean
  children: React.ReactNode
}) => {
  const [isSSR, setIsSSR] = useState(initialIsSSR)

  useEffect(() => {
    if (isSSR) {
      setIsSSR(false)
    }
  }, [])

  return <SSRContext.Provider value={isSSR}>{children}</SSRContext.Provider>
}
