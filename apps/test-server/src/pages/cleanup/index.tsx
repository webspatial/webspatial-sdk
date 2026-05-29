import React from 'react'
import { Model } from '@webspatial/react-sdk'

export function CleanupSpa() {
  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Spatial Div and Static Model</h2>
      <div className="mt-2 flex justify-center">
        <div
          enable-xr
          style={
            {
              width: '220px',
              height: '140px',
              backgroundColor: '#2244aa',
              color: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '--xr-back': '100',
              '--xr-depth': '70',
            } as React.CSSProperties
          }
        >
          Spatial Div
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <Model
          src="/modelasset/cone.usdz"
          enable-xr
          style={{
            width: '240px',
            height: '160px',
            '--xr-back': '120',
            '--xr-depth': '80',
          }}
        />
      </div>
    </div>
  )
}

export function CleanupModel() {
  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Minimal Static Model</h2>
      <div className="mt-2 flex justify-center">
        <Model
          src="/modelasset/cone.usdz"
          enable-xr
          style={{
            width: '240px',
            height: '160px',
            '--xr-back': '120',
            '--xr-depth': '80',
          }}
        />
      </div>
    </div>
  )
}

export function CleanupIframe() {
  const iframeSrc = `https://webspatial-hackathon.vercel.app/`
  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Static Model within Iframe</h2>
      <iframe
        title="cleanup-iframe"
        src={iframeSrc}
        style={{ width: '100%', height: '260px', border: '1px solid #444' }}
      />
    </div>
  )
}
