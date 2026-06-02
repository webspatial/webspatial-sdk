'use client'

import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import { Model } from '@webspatial/react-sdk/eager'

export function EagerSpatialIsland() {
  const [spatialTapCount, setSpatialTapCount] = useState(0)
  const onFirstCellSpatialTap = useCallback(() => {
    setSpatialTapCount(c => c + 1)
  }, [])

  return (
    <>
      <h2 style={{ marginTop: 24 }}>SpatialDiv grid</h2>
      <p style={{ marginBottom: 8, fontSize: 14 }}>
        Cell <strong>1</strong> listens for <code>onSpatialTap</code> (
        <strong>{spatialTapCount}</strong>) — increments when the slab is
        spatially tapped (WebSpatial runtime).
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 100px)',
          gap: 16,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            enable-xr
            {...(i === 0 ? { onSpatialTap: onFirstCellSpatialTap } : {})}
            style={
              {
                width: 100,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                borderRadius: 8,
                background: '#206',
                '--xr-back': '40',
                '--xr-background-material': 'thin',
                ...(i === 0 && spatialTapCount > 0
                  ? { boxShadow: '0 0 0 3px rgb(251 191 36 / 0.95)' }
                  : {}),
              } as CSSProperties
            }
          >
            {i === 0 && spatialTapCount > 0 ? `1 (${spatialTapCount})` : i + 1}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Model</h2>
      <Model
        enable-xr
        src="/modelasset/cone.usdz"
        style={{
          width: 320,
          height: 320,
          borderRadius: 12,
          background: '#ddd',
        }}
      />
    </>
  )
}
