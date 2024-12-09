import { SpatialSession } from '@xrsdk/runtime'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'
import ReactMarkdown from 'react-markdown'

function MySample(props: { session?: SpatialSession }) {
  var [showMarkdown, setShowMarkdown] = useState('')
  fetch('/src/docsWebsite/docs/gettingStarted.md')
    .then(response => response.text())
    .then(text => {
      setShowMarkdown(text)
    })

  return (
    <div className="w-full">
      <ReactMarkdown className="prose w-full max-w-none text-gray-200 prose-headings:text-gray-200 p-5">
        {showMarkdown}
      </ReactMarkdown>
    </div>
  )
}
showSample(MySample, false)
