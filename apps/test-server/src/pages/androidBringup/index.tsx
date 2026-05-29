import { Spatial } from '@webspatial/core-sdk'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [state] = useState<'Transparent' | 'Translucent' | 'None'>(
    'Transparent',
  )
  var [supported, setSupported] = useState(false)
  var [versionDisplay, setVersionDisplay] = useState('')

  useEffect(() => {
    // CODESAMPLE_START
    let spatial = new Spatial()
    let versionLog =
      'Client version: ' +
      spatial.getClientVersion() +
      ' Native Version: ' +
      spatial.getNativeVersion()
    setVersionDisplay(versionLog)
    if (spatial.isSupported()) {
      setSupported(true)
    }
    // CODESAMPLE_END
  }, [])

  const handleToggle = () => {
    // setState(current => {
    //   switch (current) {
    //     case 'Transparent':
    //       SpatialHelper.instance?.setBackgroundStyle(
    //         { material: { type: 'translucent' }, cornerRadius: 15 },
    //         '#00000000',
    //       )
    //       return 'Translucent'
    //     case 'Translucent':
    //       SpatialHelper.instance?.setBackgroundStyle(
    //         { material: { type: 'none' }, cornerRadius: 15 },
    //         '#000000',
    //       )
    //       return 'None'
    //     case 'None':
    //       SpatialHelper.instance?.setBackgroundStyle(
    //         { material: { type: 'transparent' }, cornerRadius: 15 },
    //         '#00000000',
    //       )
    //       return 'Transparent'
    //   }
    // })
  }

  return (
    <div className="h-full w-full p-4">
      <div className="h-full w-full flex gap-4">
        {/* Left side - contains two panels stacked vertically */}
        <div className="w-1/2 h-full flex flex-col gap-4">
          {/* Top left panel */}
          <div className="h-1/2 bg-gray-800 p-4 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2022/12/29/17/10/sunset-7685372_960_720.jpg')] bg-cover bg-center opacity-40"></div>
            <div className="relative z-10 text-white">
              <div className="text-xl">Session supported?</div>
              <div>
                <div>
                  SpatialSession is {supported ? '' : 'not'} supported in this
                  browser
                  <h1>{versionDisplay}</h1>
                </div>
              </div>
              <br />
              <div className="text-xl">Background toggle</div>
              <div>
                <button
                  onClick={handleToggle}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Current State: {state}
                </button>
              </div>
            </div>
          </div>
          {/* Bottom left panel */}
          <div className="h-1/2 bg-gray-800 p-4 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2024/03/21/15/42/anime-8648011_960_720.jpg')] bg-cover bg-center opacity-40"></div>
            <div className="relative z-10 text-white">Bottom Left Panel</div>
          </div>
        </div>

        {/* Right side panel - takes full height */}
        <div className="w-1/2 h-full bg-gray-800 p-4 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2024/05/09/08/07/ai-generated-8750175_960_720.jpg')] bg-cover bg-center opacity-40"></div>
          <div className="relative z-10 text-white">Right Panel</div>
        </div>
      </div>
    </div>
  )
}

export default App
