import React, { createContext, useContext, useEffect, useState } from 'react'
import { WebSpatialResourceManager } from './WebSpatialResourceManager'
import {
  WRMStats,
  ResourceMetadata,
  ResourceState,
  WRMInstrumentation,
} from './types'
import { SpatialSession } from '@webspatial/core-sdk'

interface WRMContextValue {
  wrm: WebSpatialResourceManager
  stats: WRMStats
  resources: ResourceMetadata[]
}

const WRMContext = createContext<WRMContextValue | undefined>(undefined)

interface WRMProviderProps {
  children: React.ReactNode
  session: SpatialSession
  instrumentation?: WRMInstrumentation
  maxMemoryMB?: number
}

export const WRMProvider: React.FC<WRMProviderProps> = ({
  children,
  session,
  instrumentation = {},
  maxMemoryMB = 50,
}) => {
  const [wrm] = useState(
    () => new WebSpatialResourceManager(session, instrumentation, maxMemoryMB),
  )
  const [stats, setStats] = useState<WRMStats>(() => wrm.getStats())
  const [resources, setResources] = useState<ResourceMetadata[]>(() =>
    wrm.getAllResources(),
  )

  useEffect(() => {
    const updateStats = () => {
      setStats(wrm.getStats())
      setResources(wrm.getAllResources())
    }

    // Update stats periodically for instrumentation
    const interval = setInterval(updateStats, 1000)

    // Enhance instrumentation with React state updates
    const enhancedInstrumentation: WRMInstrumentation = {
      ...instrumentation,
      onResourceStateChange: metadata => {
        updateStats()
        instrumentation.onResourceStateChange?.(metadata)
      },
      onResourceLoadStart: metadata => {
        updateStats()
        instrumentation.onResourceLoadStart?.(metadata)
      },
      onResourceLoadComplete: metadata => {
        updateStats()
        instrumentation.onResourceLoadComplete?.(metadata)
      },
      onResourceError: metadata => {
        updateStats()
        instrumentation.onResourceError?.(metadata)
      },
    }

    // Update the WRM with enhanced instrumentation
    wrm.setInstrumentation(enhancedInstrumentation)

    return () => {
      clearInterval(interval)
      wrm.destroy()
    }
  }, [wrm, instrumentation])

  return (
    <WRMContext.Provider value={{ wrm, stats, resources }}>
      {children}
    </WRMContext.Provider>
  )
}

export const useWRM = () => {
  const context = useContext(WRMContext)
  if (!context) {
    throw new Error('useWRM must be used within a WRMProvider')
  }
  return context
}

export const useWRMStats = (): WRMStats => {
  const { stats } = useWRM()
  return stats
}

export const useWRMResources = (
  filter?: (resource: ResourceMetadata) => boolean,
): ResourceMetadata[] => {
  const { resources } = useWRM()
  return filter ? resources.filter(filter) : resources
}
