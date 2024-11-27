import { SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'
import ReactMarkdown from 'react-markdown'

function MySample(props: { session?: SpatialSession }) {
  return <div className="w-full">Hello world</div>
}
showSample(MySample, false)
