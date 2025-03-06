import { SpatialSession } from '@webspatial/core-sdk'
import { useEffect, useState } from 'react'
import { showSample } from './sampleLoader'
import ReactMarkdown from 'react-markdown'

function MySample(_props: { session?: SpatialSession }) {
  var [showMarkdown, setShowMarkdown] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    var docFile = urlParams.get('docFile')
    if (!docFile) {
      docFile = 'gettingStarted.md'
    }
    fetch('/src/docsWebsite/docs/' + docFile)
      .then(response => response.text())
      .then(text => {
        setShowMarkdown(text)
      })
  }, [])

  return (
    <div className="w-full">
      <ReactMarkdown className="prose w-full max-w-none text-gray-200 prose-headings:text-gray-200 p-5">
        {showMarkdown}
      </ReactMarkdown>
    </div>
  )
}
showSample(MySample, false)
