import { SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  return (
    <div>
      <div
        className="btn"
        onClick={async () => {
          if (props.session) {
            let session = props.session
            // CODESAMPLE_START
            // Create window group
            var wg = await session.createWindowGroup('Plain')

            // Create a root entity displaying a webpage
            var ent = await session!.createEntity()
            var i = await session!.createWindowComponent(wg)
            await i.loadURL('http://google.com')
            await ent.setCoordinateSpace('Root')
            await ent.setComponent(i)

            // Add enitity the windowgroup
            await ent.setParentWindowGroup(wg)
            // CODESAMPLE_END
          }
        }}
      >
        Open Window Group
      </div>
    </div>
  )
}
showSample(MySample)
