import { SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'

function MySample(props: { session?: SpatialSession }) {
  return (
    <div>
      <a href="/">Homepage</a>
    </div>
  )
}
showSample(MySample, false)
