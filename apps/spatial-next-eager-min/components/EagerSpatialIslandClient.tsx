'use client'

import dynamic from 'next/dynamic'

const EagerSpatialIsland = dynamic(
  () =>
    import('@/components/EagerSpatialIsland').then(m => ({
      default: m.EagerSpatialIsland,
    })),
  {
    ssr: false,
    loading: () => (
      <p
        role="status"
        data-testid="eager-island-loading"
        style={{
          padding: 16,
          borderRadius: 8,
          background: '#f5f5f5',
          border: '1px dashed #999',
        }}
      >
        Client island loading — eager spatial SDK is not executed during SSR.
      </p>
    ),
  },
)

export function EagerSpatialIslandClient() {
  return <EagerSpatialIsland />
}
